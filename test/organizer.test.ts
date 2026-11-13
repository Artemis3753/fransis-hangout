import { describe, expect, it } from "vitest";
import {
  closePollAs,
  createPollId,
  joinAs,
  joinPoll,
  readAnswers,
  readPoll,
  readResults,
  readRespondent,
  removeRespondent,
  reopenPoll,
  saveAnswers,
} from "./helpers";

const keyInvalid = { error: { code: "ORGANIZER_KEY_INVALID" } };

type PollBody = { poll: { status: string; confirmedStartDate: string | null; confirmedEndDate: string | null } };
async function pollOf(pollId: string) {
  return ((await (await readPoll(pollId)).json()) as PollBody).poll;
}

// 조사 기간은 helpers의 validPoll: 2026-12-01 ~ 2027-01-31
const range = { confirmedStartDate: "2026-12-19", confirmedEndDate: "2026-12-21" };

describe("마감", () => {
  it.each<[string, string | null]>([
    ["키가 없으면", null],
    ["키가 틀리면", "wrong-key"],
  ])("%s ORGANIZER_KEY_INVALID로 거절하고 조사는 열려 있다", async (_label, key) => {
    const pollId = await createPollId();

    const res = await closePollAs(pollId, key, range);

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual(keyInvalid);
    expect(await pollOf(pollId)).toMatchObject({ status: "open", confirmedStartDate: null, confirmedEndDate: null });
  });

  it("확정 날짜 없이 마감할 수 있다", async () => {
    const pollId = await createPollId();

    const res = await closePollAs(pollId);

    expect(res.status).toBe(200);
    expect(((await res.json()) as PollBody).poll).toMatchObject({
      status: "closed",
      confirmedStartDate: null,
      confirmedEndDate: null,
    });
  });

  it("확정 날짜와 함께 마감하면 누구나 읽는 조사 정보에 확정 날짜가 보인다", async () => {
    const pollId = await createPollId();

    await closePollAs(pollId, undefined, range);

    expect(await pollOf(pollId)).toMatchObject({
      status: "closed",
      confirmedStartDate: "2026-12-19",
      confirmedEndDate: "2026-12-21",
    });
  });

  it("확정 날짜는 하루짜리도 되고, 기간의 처음과 끝에 닿아도 된다", async () => {
    const pollId = await createPollId();
    const oneDay = await closePollAs(pollId, undefined, { confirmedStartDate: "2026-12-05", confirmedEndDate: "2026-12-05" });
    const edges = await closePollAs(pollId, undefined, { confirmedStartDate: "2026-12-01", confirmedEndDate: "2027-01-31" });

    expect(oneDay.status).toBe(200);
    expect(edges.status).toBe(200);
  });

  describe("확정 날짜가 올바르지 않으면 거절하고 아무것도 바꾸지 않는다", () => {
    it.each<[string, unknown, string]>([
      ["끝이 시작보다 앞서면", { confirmedStartDate: "2026-12-21", confirmedEndDate: "2026-12-19" }, "END_BEFORE_START"],
      ["시작이 조사 기간보다 앞서면", { confirmedStartDate: "2026-11-30", confirmedEndDate: "2026-12-05" }, "CONFIRMED_OUT_OF_RANGE"],
      ["끝이 조사 기간보다 뒤면", { confirmedStartDate: "2027-01-30", confirmedEndDate: "2027-02-01" }, "CONFIRMED_OUT_OF_RANGE"],
      ["날짜 형식이 틀리면", { confirmedStartDate: "12/19", confirmedEndDate: "2026-12-21" }, "INVALID_DATE"],
      ["존재하지 않는 날짜면", { confirmedStartDate: "2026-12-19", confirmedEndDate: "2026-02-30" }, "INVALID_DATE"],
      ["시작만 있으면", { confirmedStartDate: "2026-12-19" }, "INVALID_REQUEST"],
      ["끝만 있으면", { confirmedEndDate: "2026-12-19" }, "INVALID_REQUEST"],
      ["본문이 객체가 아니면", [range], "INVALID_REQUEST"],
    ])("%s %s", async (_label, body, code) => {
      const pollId = await createPollId();

      const res = await closePollAs(pollId, undefined, body);

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: { code } });
      expect(await pollOf(pollId)).toMatchObject({ status: "open", confirmedStartDate: null });
    });
  });

  it("없는 조사는 POLL_NOT_FOUND지만, 키가 틀리면 조사가 있는지 알려 주지 않고 401이다", async () => {
    const missing = await closePollAs("no-such-poll");
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ error: { code: "POLL_NOT_FOUND" } });

    const wrongKey = await closePollAs("no-such-poll", "wrong-key");
    expect(wrongKey.status).toBe(401);
  });

  it("이미 마감된 조사를 다시 마감하면 확정 날짜를 바꿀 수 있다", async () => {
    const pollId = await createPollId();
    await closePollAs(pollId, undefined, range);

    await closePollAs(pollId, undefined, { confirmedStartDate: "2026-12-26", confirmedEndDate: "2026-12-27" });

    expect(await pollOf(pollId)).toMatchObject({ confirmedStartDate: "2026-12-26", confirmedEndDate: "2026-12-27" });
  });

  describe("마감된 동안", () => {
    it("참여와 응답 저장은 POLL_CLOSED로 거절하고, 결과와 조사 정보는 계속 읽힌다", async () => {
      const pollId = await createPollId();
      const { respondentId, token } = await joinAs(pollId, "민지");
      await saveAnswers(pollId, respondentId, token, { answers: { "2026-12-05": "preferred" } });
      await closePollAs(pollId, undefined, range);

      const join = await joinPoll(pollId, "수아");
      const save = await saveAnswers(pollId, respondentId, token, { answers: { "2026-12-05": "unavailable" } });

      expect(join.status).toBe(409);
      expect(await join.json()).toEqual({ error: { code: "POLL_CLOSED" } });
      expect(save.status).toBe(409);
      expect(await save.json()).toEqual({ error: { code: "POLL_CLOSED" } });
      expect((await readPoll(pollId)).status).toBe(200);
      const results = (await (await readResults(pollId)).json()) as {
        results: { days: { date: string; preferred: string[] }[] };
      };
      expect(results.results.days.find((d) => d.date === "2026-12-05")!.preferred).toEqual(["민지"]);
    });
  });
});

describe("다시 열기", () => {
  it.each<[string, string | null]>([
    ["키가 없으면", null],
    ["키가 틀리면", "wrong-key"],
  ])("%s 거절하고 조사는 마감된 채다", async (_label, key) => {
    const pollId = await createPollId();
    await closePollAs(pollId);

    const res = await reopenPoll(pollId, key);

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual(keyInvalid);
    expect((await pollOf(pollId)).status).toBe("closed");
  });

  it("다시 열면 참여와 응답 저장이 되살아나고, 확정 날짜는 지워진다", async () => {
    // 확정 날짜를 지우는 이유: 다시 연 조사는 "아직 결정 전"이라서, 위에 옛 확정 날짜가 남아 있으면 오해를 부른다.
    const pollId = await createPollId();
    const { respondentId, token } = await joinAs(pollId, "민지");
    await closePollAs(pollId, undefined, range);

    const res = await reopenPoll(pollId);

    expect(res.status).toBe(200);
    expect(await pollOf(pollId)).toMatchObject({ status: "open", confirmedStartDate: null, confirmedEndDate: null });
    expect((await joinPoll(pollId, "수아")).status).toBe(201);
    expect((await saveAnswers(pollId, respondentId, token, { answers: { "2026-12-05": "preferred" } })).status).toBe(200);
  });

  it("없는 조사는 POLL_NOT_FOUND다", async () => {
    const res = await reopenPoll("no-such-poll");

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: { code: "POLL_NOT_FOUND" } });
  });
});

describe("응답자 삭제", () => {
  async function setup() {
    const pollId = await createPollId();
    const minji = await joinAs(pollId, "민지");
    const suah = await joinAs(pollId, "수아");
    await saveAnswers(pollId, minji.respondentId, minji.token, { answers: { "2026-12-05": "preferred", "2026-12-06": "unavailable" } });
    await saveAnswers(pollId, suah.respondentId, suah.token, { answers: { "2026-12-05": "available" } });
    return { pollId, minji, suah };
  }

  type Results = {
    respondentCount: number;
    answeredCount: number;
    respondents: { id: string; name: string; answered: boolean }[];
    days: { date: string; preferred: string[]; available: string[]; unavailable: string[]; unanswered: number }[];
    ranking: string[];
  };
  const resultsOf = async (pollId: string) => ((await (await readResults(pollId)).json()) as { results: Results }).results;

  it.each<[string, (s: { minji: { token: string } }) => string | null]>([
    ["키가 없으면", () => null],
    ["키가 틀리면", () => "wrong-key"],
    // 응답자의 수정 토큰은 자기 응답만 고치는 열쇠일 뿐, 주최자 키가 아니다
    ["응답자 본인의 수정 토큰이면", (s) => s.minji.token],
  ])("%s 거절하고 응답자는 그대로다", async (_label, pickKey) => {
    const s = await setup();

    const res = await removeRespondent(s.pollId, s.minji.respondentId, pickKey(s));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual(keyInvalid);
    expect((await resultsOf(s.pollId)).respondentCount).toBe(2);
  });

  it("지우면 그 사람의 응답이 모든 집계·이름·순위·'M명 응답'에서 사라진다", async () => {
    const s = await setup();

    const res = await removeRespondent(s.pollId, s.minji.respondentId);

    expect(res.status).toBe(204);
    const r = await resultsOf(s.pollId);
    expect(r.respondentCount).toBe(1);
    expect(r.answeredCount).toBe(1);
    const day5 = r.days.find((d) => d.date === "2026-12-05")!;
    expect(day5.preferred).toEqual([]);
    expect(day5.available).toEqual(["수아"]);
    expect(day5.unanswered).toBe(0);
    // 민지만 답했던 12/6은 아무도 답하지 않은 날이 되어 순위에서 빠진다
    expect(r.days.find((d) => d.date === "2026-12-06")!.unavailable).toEqual([]);
    expect(r.ranking).toEqual(["2026-12-05"]);
  });

  it("지운 사람의 이름은 다시 쓸 수 있다", async () => {
    const s = await setup();
    await removeRespondent(s.pollId, s.minji.respondentId);

    const again = await joinPoll(s.pollId, "민지");

    expect(again.status).toBe(201);
  });

  it("지운 사람의 수정 링크와 토큰은 더 이상 통하지 않고, 남의 응답은 그대로다", async () => {
    const s = await setup();
    await removeRespondent(s.pollId, s.minji.respondentId);
    const invalid = { error: { code: "EDIT_TOKEN_INVALID" } };

    const who = await readRespondent(s.pollId, s.minji.respondentId, s.minji.token);
    const read = await readAnswers(s.pollId, s.minji.respondentId, s.minji.token);
    const write = await saveAnswers(s.pollId, s.minji.respondentId, s.minji.token, { answers: { "2026-12-05": "preferred" } });

    for (const res of [who, read, write]) {
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual(invalid);
    }
    expect(await (await readAnswers(s.pollId, s.suah.respondentId, s.suah.token)).json()).toEqual({
      answers: { "2026-12-05": "available" },
    });
  });

  it("없는 응답자, 다른 조사의 응답자는 RESPONDENT_NOT_FOUND이고 아무도 지워지지 않는다", async () => {
    const s = await setup();
    const other = await setup();

    const missing = await removeRespondent(s.pollId, "no-such-respondent");
    const crossPoll = await removeRespondent(s.pollId, other.minji.respondentId);

    for (const res of [missing, crossPoll]) {
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: { code: "RESPONDENT_NOT_FOUND" } });
    }
    expect((await resultsOf(other.pollId)).respondentCount).toBe(2);
  });

  it("마감된 조사에서도 지울 수 있다", async () => {
    const s = await setup();
    await closePollAs(s.pollId);

    const res = await removeRespondent(s.pollId, s.minji.respondentId);

    expect(res.status).toBe(204);
    expect((await resultsOf(s.pollId)).respondentCount).toBe(1);
  });

  it("결과에는 응답자 목록과 각자 응답했는지가 참여 순서대로 나온다", async () => {
    const pollId = await createPollId();
    const a = await joinAs(pollId, "가람");
    const b = await joinAs(pollId, "나리"); // 참여만 하고 답하지 않았다
    await saveAnswers(pollId, a.respondentId, a.token, { answers: { "2026-12-05": "preferred" } });

    const r = await resultsOf(pollId);

    expect(r.respondents).toEqual([
      { id: a.respondentId, name: "가람", answered: true },
      { id: b.respondentId, name: "나리", answered: false },
    ]);
    // 수정 토큰은 목록 어디에도 없다
    expect(JSON.stringify(r)).not.toContain(a.token);
  });
});
