import { describe, expect, it } from "vitest";
import { createPollId, joinAs, readAnswers, readRespondent, saveAnswers } from "./helpers";

// 개인 수정 링크는 "응답자 id + 수정 토큰"을 담은 주소다. 다른 기기에서 링크를 열면 화면은 이 둘만 가지고
// 서버에 본인 확인을 하므로, 아래 테스트는 그 두 값만으로 무엇이 되고 안 되는지를 확인한다.
const invalid = { error: { code: "EDIT_TOKEN_INVALID" } };

describe("개인 수정 링크로 접근 복원", () => {
  it("링크의 id와 토큰만으로 내 이름을 확인하고, 저장해 둔 응답을 읽고, 고쳐 저장할 수 있다", async () => {
    const pollId = await createPollId();
    const { respondentId, token } = await joinAs(pollId, "민지");
    await saveAnswers(pollId, respondentId, token, { answers: { "2026-12-05": "preferred" } });

    // 기기 저장소가 비어 있는 다른 브라우저를 흉내 낸다: 가진 것은 링크에 든 id와 토큰뿐이다.
    const who = await readRespondent(pollId, respondentId, token);
    expect(who.status).toBe(200);
    expect(await who.json()).toEqual({ respondent: { id: respondentId, name: "민지" } });

    expect(await (await readAnswers(pollId, respondentId, token)).json()).toEqual({
      answers: { "2026-12-05": "preferred" },
    });
    const edited = await saveAnswers(pollId, respondentId, token, { answers: { "2026-12-06": "available" } });
    expect(edited.status).toBe(200);
    expect(await (await readAnswers(pollId, respondentId, token)).json()).toEqual({
      answers: { "2026-12-06": "available" },
    });
  });

  it("응답에는 이름만 있고 토큰은 어디에도 없다", async () => {
    const pollId = await createPollId();
    const { respondentId, token } = await joinAs(pollId, "민지");

    const text = await (await readRespondent(pollId, respondentId, token)).text();

    expect(text).not.toContain(token);
    expect(Object.keys(JSON.parse(text).respondent).sort()).toEqual(["id", "name"]);
  });

  describe("올바르지 않은 링크는 접근을 주지 않는다", () => {
    async function setup() {
      const pollId = await createPollId();
      const minji = await joinAs(pollId, "민지");
      const suah = await joinAs(pollId, "수아");
      return { pollId, minji, suah };
    }

    type Scene = Awaited<ReturnType<typeof setup>>;

    it.each<[string, (s: Scene) => { respondentId: string; token: string | null }]>([
      ["토큰이 없으면", (s) => ({ respondentId: s.minji.respondentId, token: null })],
      ["토큰이 엉터리면", (s) => ({ respondentId: s.minji.respondentId, token: "not-the-token" })],
      // 링크를 복사하다 끝이 잘렸거나 한 글자가 바뀐 경우
      ["토큰이 한 글자라도 다르면", (s) => ({ respondentId: s.minji.respondentId, token: s.minji.token.slice(0, -1) + (s.minji.token.endsWith("A") ? "B" : "A") })],
      ["토큰이 잘렸으면", (s) => ({ respondentId: s.minji.respondentId, token: s.minji.token.slice(0, 10) })],
      // 한 응답자의 링크로 다른 응답자 자리를 열 수 없다
      ["다른 응답자의 토큰이면", (s) => ({ respondentId: s.minji.respondentId, token: s.suah.token })],
      ["없는 응답자 id면", (s) => ({ respondentId: "no-such-respondent", token: s.minji.token })],
    ])("%s EDIT_TOKEN_INVALID로 거절한다", async (_label, pick) => {
      const s = await setup();
      const { respondentId, token } = pick(s);

      const res = await readRespondent(s.pollId, respondentId, token);

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual(invalid);
    });

    it("다른 조사의 링크는 이 조사에서 통하지 않는다", async () => {
      const s = await setup();
      const otherPollId = await createPollId();

      const res = await readRespondent(otherPollId, s.minji.respondentId, s.minji.token);

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual(invalid);
    });

    it("없는 조사도 존재 여부를 드러내지 않고 똑같이 거절한다", async () => {
      const s = await setup();

      const res = await readRespondent("no-such-poll", s.minji.respondentId, s.minji.token);

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual(invalid);
    });

    it("수아의 링크로 민지의 응답을 읽거나 고칠 수 없고, 민지의 응답은 그대로다", async () => {
      const s = await setup();
      await saveAnswers(s.pollId, s.minji.respondentId, s.minji.token, { answers: { "2026-12-05": "preferred" } });

      const read = await readAnswers(s.pollId, s.minji.respondentId, s.suah.token);
      const write = await saveAnswers(s.pollId, s.minji.respondentId, s.suah.token, { answers: {} });

      expect(read.status).toBe(401);
      expect(write.status).toBe(401);
      expect(await (await readAnswers(s.pollId, s.minji.respondentId, s.minji.token)).json()).toEqual({
        answers: { "2026-12-05": "preferred" },
      });
    });
  });
});
