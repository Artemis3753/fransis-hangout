import { describe, expect, it } from "vitest";
import { closePoll, createPollId, joinAs, readAnswers, saveAnswers } from "./helpers";

describe("내 응답 저장하고 읽기", () => {
  it("날짜별 상태를 저장하면 같은 내용을 다시 읽을 수 있다", async () => {
    const pollId = await createPollId();
    const { respondentId, token } = await joinAs(pollId);
    const answers = { "2026-12-05": "preferred", "2026-12-06": "available", "2026-12-07": "unavailable" };

    const saved = await saveAnswers(pollId, respondentId, token, { answers });
    expect(saved.status).toBe(200);

    const read = await readAnswers(pollId, respondentId, token);
    expect(read.status).toBe(200);
    expect(await read.json()).toEqual({ answers });
  });

  it("다시 저장하면 이전 응답은 통째로 교체된다(응답 없음으로 되돌린 날은 사라진다)", async () => {
    const pollId = await createPollId();
    const { respondentId, token } = await joinAs(pollId);
    await saveAnswers(pollId, respondentId, token, {
      answers: { "2026-12-05": "preferred", "2026-12-06": "available" },
    });

    await saveAnswers(pollId, respondentId, token, { answers: { "2026-12-06": "unavailable", "2026-12-20": "preferred" } });

    const read = await readAnswers(pollId, respondentId, token);
    expect(await read.json()).toEqual({ answers: { "2026-12-06": "unavailable", "2026-12-20": "preferred" } });
  });

  it("빈 응답을 저장하면 모든 응답이 지워진다", async () => {
    const pollId = await createPollId();
    const { respondentId, token } = await joinAs(pollId);
    await saveAnswers(pollId, respondentId, token, { answers: { "2026-12-05": "preferred" } });

    const saved = await saveAnswers(pollId, respondentId, token, { answers: {} });

    expect(saved.status).toBe(200);
    expect(await (await readAnswers(pollId, respondentId, token)).json()).toEqual({ answers: {} });
  });

  describe("본인만 고칠 수 있다", () => {
    // 같은 조사의 민지와 수아. 수아의 토큰으로 민지의 응답을 건드리려는 상황을 포함한다.
    async function setup() {
      const pollId = await createPollId();
      const minji = await joinAs(pollId, "민지");
      const suah = await joinAs(pollId, "수아");
      await saveAnswers(pollId, minji.respondentId, minji.token, { answers: { "2026-12-05": "preferred" } });
      return { pollId, minji, suah };
    }

    type Scene = Awaited<ReturnType<typeof setup>>;

    it.each<[string, (scene: Scene) => string | null]>([
      ["토큰이 없으면", () => null],
      ["토큰이 틀리면", () => "not-the-token"],
      ["다른 응답자의 토큰이면", (scene) => scene.suah.token],
    ])("%s 저장과 조회를 EDIT_TOKEN_INVALID로 거절하고 기존 응답은 그대로다", async (_label, pickToken) => {
      const s = await setup();
      const token = pickToken(s);

      const write = await saveAnswers(s.pollId, s.minji.respondentId, token, { answers: { "2026-12-05": "unavailable" } });
      expect(write.status).toBe(401);
      expect(await write.json()).toEqual({ error: { code: "EDIT_TOKEN_INVALID" } });

      const read = await readAnswers(s.pollId, s.minji.respondentId, token);
      expect(read.status).toBe(401);
      expect(await read.json()).toEqual({ error: { code: "EDIT_TOKEN_INVALID" } });

      // 거절된 시도가 민지의 응답을 바꾸지 않았는지, 민지 본인의 토큰으로 확인한다.
      const own = await readAnswers(s.pollId, s.minji.respondentId, s.minji.token);
      expect(await own.json()).toEqual({ answers: { "2026-12-05": "preferred" } });
    });

    it("없는 응답자 id도 같은 EDIT_TOKEN_INVALID로 답해서 응답자 존재 여부를 알려 주지 않는다", async () => {
      const s = await setup();

      const res = await saveAnswers(s.pollId, "no-such-respondent", s.minji.token, { answers: {} });

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: { code: "EDIT_TOKEN_INVALID" } });
    });

    it("다른 조사의 주소로는 내 토큰이 통하지 않는다", async () => {
      const s = await setup();
      const otherPollId = await createPollId();

      const res = await saveAnswers(otherPollId, s.minji.respondentId, s.minji.token, { answers: {} });

      expect(res.status).toBe(401);
    });
  });

  describe("잘못된 입력은 전체를 거절하고 아무것도 바꾸지 않는다", () => {
    // 조사 기간은 2026-12-01 ~ 2027-01-31이다(helpers의 validPoll).
    it.each([
      ["기간보다 앞선 날짜", { "2026-11-30": "preferred" }, "DATE_OUT_OF_RANGE"],
      ["기간보다 뒤의 날짜", { "2027-02-01": "preferred" }, "DATE_OUT_OF_RANGE"],
      ["존재하지 않는 날짜", { "2026-12-32": "preferred" }, "INVALID_DATE"],
      ["다른 표기 형식의 날짜", { "12/05/2026": "preferred" }, "INVALID_DATE"],
      ["모르는 상태 이름", { "2026-12-05": "maybe" }, "INVALID_AVAILABILITY"],
      ["문자열이 아닌 상태", { "2026-12-05": 1 }, "INVALID_AVAILABILITY"],
    ])("%s이 하나라도 섞이면 %s", async (_label, bad, code) => {
      const pollId = await createPollId();
      const { respondentId, token } = await joinAs(pollId);
      const before = { "2026-12-20": "preferred" };
      await saveAnswers(pollId, respondentId, token, { answers: before });

      // 올바른 날짜(2026-12-10)와 잘못된 항목을 같이 보낸다. 올바른 날짜까지 저장되면 안 된다.
      const res = await saveAnswers(pollId, respondentId, token, { answers: { "2026-12-10": "available", ...bad } });

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: { code } });
      expect(await (await readAnswers(pollId, respondentId, token)).json()).toEqual({ answers: before });
    });

    it.each([
      ["null", null],
      ["배열", []],
      ["answers가 없는 객체", {}],
      ["answers가 배열", { answers: [] }],
      ["answers가 문자열", { answers: "2026-12-05" }],
    ])("본문이 %s이면 INVALID_REQUEST로 거절한다", async (_label, body) => {
      const pollId = await createPollId();
      const { respondentId, token } = await joinAs(pollId);

      const res = await saveAnswers(pollId, respondentId, token, body);

      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: { code: "INVALID_REQUEST" } });
    });
  });

  it("마감된 조사에는 저장이 POLL_CLOSED로 거절되지만, 이미 저장한 내 응답은 계속 읽힌다", async () => {
    const pollId = await createPollId();
    const { respondentId, token } = await joinAs(pollId);
    await saveAnswers(pollId, respondentId, token, { answers: { "2026-12-05": "preferred" } });
    await closePoll(pollId);

    const write = await saveAnswers(pollId, respondentId, token, { answers: { "2026-12-05": "unavailable" } });
    expect(write.status).toBe(409);
    expect(await write.json()).toEqual({ error: { code: "POLL_CLOSED" } });

    const read = await readAnswers(pollId, respondentId, token);
    expect(read.status).toBe(200);
    expect(await read.json()).toEqual({ answers: { "2026-12-05": "preferred" } });
  });

  it("응답은 응답자별로 따로 저장된다", async () => {
    const pollId = await createPollId();
    const minji = await joinAs(pollId, "민지");
    const suah = await joinAs(pollId, "수아");

    await saveAnswers(pollId, minji.respondentId, minji.token, { answers: { "2026-12-05": "preferred" } });
    await saveAnswers(pollId, suah.respondentId, suah.token, { answers: { "2026-12-05": "unavailable" } });

    expect(await (await readAnswers(pollId, minji.respondentId, minji.token)).json()).toEqual({
      answers: { "2026-12-05": "preferred" },
    });
    expect(await (await readAnswers(pollId, suah.respondentId, suah.token)).json()).toEqual({
      answers: { "2026-12-05": "unavailable" },
    });
  });
});
