import { describe, expect, it } from "vitest";
import { createPollId, joinAs, readResults, saveAnswers } from "./helpers";

type Availability = "preferred" | "available" | "unavailable";
type DayResult = {
  date: string;
  preferred: string[];
  available: string[];
  unavailable: string[];
  unanswered: number;
  unanimous: boolean;
};
type Results = { respondentCount: number; answeredCount: number; days: DayResult[]; ranking: string[] };

async function results(pollId: string): Promise<Results> {
  const res = await readResults(pollId);
  expect(res.status).toBe(200);
  return ((await res.json()) as { results: Results }).results;
}

// 이름과 응답({ 날짜: 상태 })으로 사람들을 한 번에 참여시키고 저장한다. answers가 null이면 참여만 하고 저장하지 않는다.
async function populate(pollId: string, people: [name: string, answers: Record<string, Availability> | null][]) {
  for (const [name, answers] of people) {
    const { respondentId, token } = await joinAs(pollId, name);
    if (answers !== null) await saveAnswers(pollId, respondentId, token, { answers });
  }
}

const dayOf = (r: Results, date: string) => r.days.find((d) => d.date === date)!;

describe("결과: 날짜별 집계", () => {
  it("조사 기간의 모든 날짜가 날짜순으로 들어 있고, 아무도 답하지 않았으면 전부 응답 없음이다", async () => {
    const pollId = await createPollId(); // 2026-12-01 ~ 2027-01-31, 62일
    await populate(pollId, [["민지", null], ["수아", null]]);

    const r = await results(pollId);

    expect(r.days).toHaveLength(62);
    expect(r.days[0].date).toBe("2026-12-01");
    expect(r.days[61].date).toBe("2027-01-31");
    expect(r.days.every((d) => d.unanswered === 2 && !d.unanimous)).toBe(true);
    expect(r.ranking).toEqual([]);
  });

  it("상태마다 이름을 모아 주고, 응답하지 않은 사람 수를 센다", async () => {
    const pollId = await createPollId();
    await populate(pollId, [
      ["민지", { "2026-12-05": "preferred" }],
      ["수아", { "2026-12-05": "available" }],
      ["하준", { "2026-12-05": "unavailable" }],
      ["도윤", { "2026-12-06": "preferred" }], // 5일에는 답하지 않았다
    ]);

    const day = dayOf(await results(pollId), "2026-12-05");

    expect(day.preferred).toEqual(["민지"]);
    expect(day.available).toEqual(["수아"]);
    expect(day.unavailable).toEqual(["하준"]);
    expect(day.unanswered).toBe(1);
  });

  it("같은 상태의 이름은 참여한 순서대로 나온다", async () => {
    const pollId = await createPollId();
    await populate(pollId, [
      ["다온", { "2026-12-05": "available" }],
      ["가람", { "2026-12-05": "available" }],
      ["나리", { "2026-12-05": "available" }],
    ]);

    expect(dayOf(await results(pollId), "2026-12-05").available).toEqual(["다온", "가람", "나리"]);
  });

  it("'N명 중 M명 응답'은 하루라도 답한 사람만 센다", async () => {
    const pollId = await createPollId();
    const { respondentId, token } = await joinAs(pollId, "민지");
    await saveAnswers(pollId, respondentId, token, { answers: { "2026-12-05": "preferred" } });
    await populate(pollId, [
      ["수아", { "2026-12-06": "available", "2026-12-07": "unavailable" }], // 여러 날 답해도 한 명으로 센다
      ["하준", null], // 참여만 했다
    ]);
    // 민지가 답을 모두 지우면 더는 응답한 사람이 아니다
    await saveAnswers(pollId, respondentId, token, { answers: {} });

    const r = await results(pollId);

    expect(r.respondentCount).toBe(3);
    expect(r.answeredCount).toBe(1);
  });

  it("다시 저장한 최신 응답이 결과에 반영된다", async () => {
    const pollId = await createPollId();
    const { respondentId, token } = await joinAs(pollId, "민지");
    await saveAnswers(pollId, respondentId, token, { answers: { "2026-12-05": "preferred" } });
    expect(dayOf(await results(pollId), "2026-12-05").preferred).toEqual(["민지"]);

    await saveAnswers(pollId, respondentId, token, { answers: { "2026-12-05": "unavailable" } });

    const day = dayOf(await results(pollId), "2026-12-05");
    expect(day.preferred).toEqual([]);
    expect(day.unavailable).toEqual(["민지"]);
  });

  it("다른 조사의 응답은 섞이지 않는다", async () => {
    const pollId = await createPollId();
    const otherId = await createPollId();
    await populate(otherId, [["수아", { "2026-12-05": "preferred" }]]);
    await populate(pollId, [["민지", { "2026-12-05": "available" }]]);

    const r = await results(pollId);

    expect(r.respondentCount).toBe(1);
    expect(dayOf(r, "2026-12-05").preferred).toEqual([]);
  });

  it("링크만 알면 토큰 없이 읽을 수 있고, 없는 조사는 POLL_NOT_FOUND다", async () => {
    const pollId = await createPollId();
    expect((await readResults(pollId)).status).toBe(200);

    const missing = await readResults("no-such-poll");
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ error: { code: "POLL_NOT_FOUND" } });
  });
});

describe("결과: 후보일 순위", () => {
  // 순위 한 번에 서너 날짜만 비교하도록, 모든 테스트가 민지·수아·하준 세 명을 쓴다.
  // 각 테스트에서 "나쁜 쪽"을 일부러 더 이른 날짜에 둔다. 날짜순으로 정렬해도 통과하는 테스트는 규칙을 증명하지 못한다.

  it("안 되는 사람이 가장 적은 날이 먼저다(선호가 많아도 안 되는 사람이 있으면 밀린다)", async () => {
    const pollId = await createPollId();
    await populate(pollId, [
      ["민지", { "2026-12-05": "preferred", "2026-12-10": "available" }],
      ["수아", { "2026-12-05": "preferred", "2026-12-10": "available" }],
      ["하준", { "2026-12-05": "unavailable", "2026-12-10": "available" }],
    ]);
    // 5일: 선호 2·불가 1 / 10일: 가능 3·불가 0 → 10일이 먼저

    expect((await results(pollId)).ranking).toEqual(["2026-12-10", "2026-12-05"]);
  });

  it("안 되는 사람 수가 같으면 선호가 많은 날이 먼저다", async () => {
    const pollId = await createPollId();
    await populate(pollId, [
      ["민지", { "2026-12-05": "available", "2026-12-10": "preferred" }],
      ["수아", { "2026-12-05": "available", "2026-12-10": "preferred" }],
      ["하준", { "2026-12-05": "available", "2026-12-10": "available" }],
    ]);
    // 5일: 선호 0·가능 3 / 10일: 선호 2·가능 1 → 10일이 먼저

    expect((await results(pollId)).ranking).toEqual(["2026-12-10", "2026-12-05"]);
  });

  it("불가와 선호가 같으면 가능이 많은 날이 먼저다", async () => {
    const pollId = await createPollId();
    await populate(pollId, [
      ["민지", { "2026-12-05": "preferred", "2026-12-10": "preferred" }],
      ["수아", { "2026-12-05": "available", "2026-12-10": "available" }],
      ["하준", { "2026-12-10": "available" }], // 5일에는 답하지 않았다
    ]);
    // 5일: 선호 1·가능 1 / 10일: 선호 1·가능 2 → 10일이 먼저

    expect((await results(pollId)).ranking).toEqual(["2026-12-10", "2026-12-05"]);
  });

  it("모두 같으면 이른 날짜가 먼저다", async () => {
    const pollId = await createPollId();
    await populate(pollId, [
      ["민지", { "2026-12-20": "preferred", "2026-12-05": "preferred", "2026-12-12": "preferred" }],
    ]);

    expect((await results(pollId)).ranking).toEqual(["2026-12-05", "2026-12-12", "2026-12-20"]);
  });

  it("아무도 답하지 않은 날은 순위에 넣지 않는다", async () => {
    const pollId = await createPollId();
    await populate(pollId, [["민지", { "2026-12-05": "unavailable" }], ["수아", null]]);

    const ranking = (await results(pollId)).ranking;

    // 전원 불가인 날도 "답이 있는 날"이라 순위에는 들어가고, 61일 동안 답이 없는 날은 빠진다
    expect(ranking).toEqual(["2026-12-05"]);
  });
});

describe("결과: 전원 가능한 날", () => {
  it("답한 사람이 한 명 이상이고 모두 선호나 가능이면 unanimous다", async () => {
    const pollId = await createPollId();
    await populate(pollId, [
      ["민지", { "2026-12-05": "preferred" }],
      ["수아", { "2026-12-05": "available" }],
      ["하준", null], // 하준은 아무 날도 답하지 않았어도 5일이 전원 가능이 되는 데 영향이 없다
    ]);

    expect(dayOf(await results(pollId), "2026-12-05").unanimous).toBe(true);
  });

  it("한 명이라도 안 되면 unanimous가 아니다", async () => {
    const pollId = await createPollId();
    await populate(pollId, [["민지", { "2026-12-05": "preferred" }], ["수아", { "2026-12-05": "unavailable" }]]);

    expect(dayOf(await results(pollId), "2026-12-05").unanimous).toBe(false);
  });

  it("아무도 답하지 않은 날은 unanimous가 아니다", async () => {
    const pollId = await createPollId();
    await populate(pollId, [["민지", { "2026-12-05": "preferred" }]]);

    expect(dayOf(await results(pollId), "2026-12-06").unanimous).toBe(false);
  });
});
