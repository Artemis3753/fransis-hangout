import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { api, createPollId, joinPoll } from "./helpers";

describe("이름으로 참여하기", () => {
  it("이름만 보내면(로그인·키 없이) 응답자가 만들어지고 수정 토큰이 돌아온다", async () => {
    const pollId = await createPollId();

    const res = await joinPoll(pollId, "민지");

    expect(res.status).toBe(201);
    const body = (await res.json()) as { respondent: { id: string; name: string }; editToken: string };
    expect(body.respondent.name).toBe("민지");
    expect(typeof body.respondent.id).toBe("string");
    // 토큰은 이 사람임을 증명하는 비밀이라, 추측이 불가능한 길이여야 한다.
    expect(body.editToken.length).toBeGreaterThanOrEqual(40);
  });

  it.each([
    ["빈 문자열", ""],
    ["공백뿐", "   "],
    ["문자열이 아닌 값", 123],
    ["값 없음", undefined],
  ])("이름이 %s이면 NAME_EMPTY로 거절한다", async (_label, bad) => {
    const pollId = await createPollId();

    const res = await joinPoll(pollId, bad);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: { code: "NAME_EMPTY" } });
  });

  it("이름이 20자면 받아들이고 21자면 NAME_TOO_LONG으로 거절한다(한글도 글자 수로 센다)", async () => {
    const pollId = await createPollId();

    expect((await joinPoll(pollId, "가".repeat(20))).status).toBe(201);

    const tooLong = await joinPoll(pollId, "나".repeat(21));
    expect(tooLong.status).toBe(400);
    expect(await tooLong.json()).toEqual({ error: { code: "NAME_TOO_LONG" } });
  });

  // 글자 수는 "사람이 보는 글자" 기준이어야 한다. 자모를 풀어 쓴 "한"은 코드 포인트 3개지만 한 글자다.
  it("자모를 풀어 쓴 한글도 완성형으로 합친 글자 수로 센다", async () => {
    const decomposedHan = "한";
    const pollId = await createPollId();

    const tenChars = await joinPoll(pollId, decomposedHan.repeat(10));
    expect(tenChars.status).toBe(201);

    const twentyOneChars = await joinPoll(pollId, decomposedHan.repeat(21));
    expect(twentyOneChars.status).toBe(400);
    expect(await twentyOneChars.json()).toEqual({ error: { code: "NAME_TOO_LONG" } });
  });

  it("이름 앞뒤 공백은 잘라서 돌려준다", async () => {
    const pollId = await createPollId();

    const res = await joinPoll(pollId, "  민지  ");

    const body = (await res.json()) as { respondent: { name: string } };
    expect(body.respondent.name).toBe("민지");
  });

  it.each([
    ["똑같은 이름", "민지", "민지"],
    ["대소문자와 앞뒤 공백이 다른 이름", "Minji", "  minji "],
    // "한"을 완성형(U+D55C)으로 쓴 것과 자모를 풀어 쓴 것(ㅎ+ㅏ+ㄴ, Mac에서 흔히 섞임)은 눈에는 같다.
    ["조합 방식만 다른 한글 이름", "한", "한"],
  ])("같은 조사에서 %s은 NAME_TAKEN으로 거절한다", async (_label, first, second) => {
    const pollId = await createPollId();
    expect((await joinPoll(pollId, first)).status).toBe(201);

    const res = await joinPoll(pollId, second);

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: { code: "NAME_TAKEN" } });
  });

  it("한 조사에 30명이 참여하면 31번째는 POLL_FULL로 거절하고, 다른 조사에는 영향이 없다", async () => {
    const pollId = await createPollId();
    for (let i = 1; i <= 30; i++) {
      expect((await joinPoll(pollId, `친구${i}`)).status).toBe(201);
    }

    const overflow = await joinPoll(pollId, "친구31");
    expect(overflow.status).toBe(409);
    expect(await overflow.json()).toEqual({ error: { code: "POLL_FULL" } });

    const otherPoll = await createPollId();
    expect((await joinPoll(otherPoll, "친구31")).status).toBe(201);
  });

  it.each([
    ["JSON이 아닌 본문", "this is not json"],
    ["빈 본문", ""],
    ["null", "null"],
    ["배열", "[]"],
  ])("본문이 %s이면 서버 오류 없이 INVALID_REQUEST로 거절한다", async (_label, rawBody) => {
    const pollId = await createPollId();

    const res = await api(`/api/polls/${pollId}/respondents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: rawBody,
    });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: { code: "INVALID_REQUEST" } });
  });

  it("마감된 조사에는 POLL_CLOSED로 거절한다", async () => {
    const pollId = await createPollId();
    // 마감 기능은 06번 티켓에서 만든다. 지금은 상황 설정을 위해서만 DB 상태를 직접 바꾼다.
    await env.DB.prepare("UPDATE polls SET status = 'closed' WHERE id = ?").bind(pollId).run();

    const res = await joinPoll(pollId, "민지");

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: { code: "POLL_CLOSED" } });
  });

  it("다른 조사에서는 같은 이름을 쓸 수 있다", async () => {
    const first = await createPollId();
    const second = await createPollId();
    expect((await joinPoll(first, "민지")).status).toBe(201);

    const res = await joinPoll(second, "민지");

    expect(res.status).toBe(201);
  });

  // 외부(HTTP)에서는 관찰할 수 없는 보안 속성이라 이 한 건만 DB를 직접 읽는다.
  // 토큰 원문이 저장되면 DB가 유출될 때 누구나 남의 응답을 고칠 수 있다.
  it("수정 토큰은 원문이 아니라 해시만 저장된다", async () => {
    const pollId = await createPollId();
    const res = await joinPoll(pollId, "민지");
    const { respondent, editToken } = (await res.json()) as { respondent: { id: string }; editToken: string };

    const row = await env.DB.prepare("SELECT token_hash FROM respondents WHERE id = ?")
      .bind(respondent.id)
      .first<{ token_hash: string }>();

    expect(row?.token_hash).not.toBe(editToken);
    expect(row?.token_hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("없는 조사에 참여하려 하면 POLL_NOT_FOUND로 404를 돌려준다", async () => {
    const res = await joinPoll("this-poll-does-not-exist", "민지");

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: { code: "POLL_NOT_FOUND" } });
  });
});
