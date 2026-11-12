import { env } from "cloudflare:test";
import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import app from "../src/worker";

// 서버 앞문(HTTP 요청 → 응답)으로만 확인한다. 내부 함수나 DB를 직접 건드리지 않는다.
// (비밀값이 빠진 배포를 흉내 낼 때만 app.fetch에 바인딩을 직접 넘기지만, 이것도 요청 → 응답 경계다.)
function api(path: string, init?: RequestInit) {
  return exports.default.fetch(new Request(`https://example.com${path}`, init));
}

function createPoll(body: unknown, key: string | null = env.ORGANIZER_KEY) {
  return api("/api/polls", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(key === null ? {} : { authorization: `Bearer ${key}` }),
    },
    body: JSON.stringify(body),
  });
}

const validPoll = { title: "겨울 여행", startDate: "2026-12-01", endDate: "2027-01-31" };

describe("검색엔진 차단", () => {
  it("성공 응답과 오류 응답 모두 noindex 신호를 담는다", async () => {
    const ok = await createPoll(validPoll);
    const unauthorized = await createPoll(validPoll, "wrong-key");
    const notFound = await api("/api/polls/this-id-does-not-exist");

    for (const res of [ok, unauthorized, notFound]) {
      expect(res.headers.get("x-robots-tag")).toContain("noindex");
    }
  });
});

describe("없는 API 경로", () => {
  it("정의되지 않은 경로도 일반 텍스트가 아니라 안정적인 오류 코드로 404를 돌려준다", async () => {
    const res = await api("/api/this-route-does-not-exist");

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: { code: "NOT_FOUND" } });
  });
});

describe("조사 읽기", () => {
  it("만든 조사를 공개 id로 읽으면 같은 내용이 나오고, 읽는 데는 주최자 키가 필요 없다", async () => {
    const created = (await (await createPoll(validPoll)).json()) as { poll: { id: string } };

    const res = await api(`/api/polls/${created.poll.id}`);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      poll: { id: created.poll.id, title: "겨울 여행", startDate: "2026-12-01", endDate: "2027-01-31", status: "open" },
    });
  });

  it("모르는 id는 POLL_NOT_FOUND로 404를 돌려준다", async () => {
    const res = await api("/api/polls/this-id-does-not-exist");

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: { code: "POLL_NOT_FOUND" } });
  });
});

describe("조사 만들기", () => {
  it("주최자 키로 만들면 추측할 수 없는 공개 id가 붙은 조사가 돌아온다", async () => {
    const res = await createPoll(validPoll);

    expect(res.status).toBe(201);
    const { poll } = (await res.json()) as { poll: Record<string, unknown> };
    expect(poll).toMatchObject({ title: "겨울 여행", startDate: "2026-12-01", endDate: "2027-01-31", status: "open" });
    expect(typeof poll.id).toBe("string");
    expect((poll.id as string).length).toBeGreaterThanOrEqual(20);
  });

  it.each([
    ["키가 없으면", null],
    ["키가 틀리면", "wrong-key"],
  ])("%s 거절하고 조사 정보를 돌려주지 않는다", async (_label, key) => {
    const res = await createPoll(validPoll, key);

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: { code: "ORGANIZER_KEY_INVALID" } });
  });

  // 비밀값을 아예 설정하지 않으면 빈 문자열이 아니라 undefined가 들어온다. 이 경우도 거절해야 한다.
  it("서버에 주최자 키가 아예 없어도(undefined) 키 없는 요청을 거절한다", async () => {
    const res = await app.fetch(
      new Request("https://example.com/api/polls", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(validPoll),
      }),
      { ...env, ORGANIZER_KEY: undefined as unknown as string },
    );

    expect(res.status).toBe(401);
  });

  it("종료일이 시작일보다 앞서면 거절하고, 같은 날(하루짜리)은 받아들인다", async () => {
    const reversed = await createPoll({ ...validPoll, startDate: "2026-12-10", endDate: "2026-12-09" });
    expect(reversed.status).toBe(400);
    expect(await reversed.json()).toEqual({ error: { code: "END_BEFORE_START" } });

    const oneDay = await createPoll({ ...validPoll, startDate: "2026-12-10", endDate: "2026-12-10" });
    expect(oneDay.status).toBe(201);
  });

  it.each([
    ["존재하지 않는 날짜", "2027-02-30"],
    ["13월", "2026-13-01"],
    ["다른 표기 형식", "12/01/2026"],
    ["빈 문자열", ""],
    ["숫자", 20261201],
    ["값 없음", undefined],
  ])("시작일이 %s이면 INVALID_DATE로 거절한다", async (_label, bad) => {
    const res = await createPoll({ ...validPoll, startDate: bad });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: { code: "INVALID_DATE" } });
  });

  it("종료일이 잘못된 날짜여도 INVALID_DATE로 거절한다", async () => {
    const res = await createPoll({ ...validPoll, endDate: "2027-02-29" });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: { code: "INVALID_DATE" } });
  });

  // 12/1~3/2는 31+31+28+2 = 포함 92일, 3/3까지는 93일이다. (2027년 2월은 28일까지)
  it("기간이 시작일과 종료일을 포함해 92일이면 받아들이고, 93일이면 PERIOD_TOO_LONG으로 거절한다", async () => {
    const atLimit = await createPoll({ ...validPoll, startDate: "2026-12-01", endDate: "2027-03-02" });
    expect(atLimit.status).toBe(201);

    const overLimit = await createPoll({ ...validPoll, startDate: "2026-12-01", endDate: "2027-03-03" });
    expect(overLimit.status).toBe(400);
    expect(await overLimit.json()).toEqual({ error: { code: "PERIOD_TOO_LONG" } });
  });

  it.each([
    ["빈 문자열", ""],
    ["공백뿐", "   "],
    ["문자열이 아닌 값", 123],
    ["값 없음", undefined],
  ])("제목이 %s이면 TITLE_EMPTY로 거절한다", async (_label, bad) => {
    const res = await createPoll({ ...validPoll, title: bad });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: { code: "TITLE_EMPTY" } });
  });

  it("제목이 60자면 받아들이고 61자면 TITLE_TOO_LONG으로 거절한다(한글도 글자 수로 센다)", async () => {
    const atLimit = await createPoll({ ...validPoll, title: "가".repeat(60) });
    expect(atLimit.status).toBe(201);

    const overLimit = await createPoll({ ...validPoll, title: "가".repeat(61) });
    expect(overLimit.status).toBe(400);
    expect(await overLimit.json()).toEqual({ error: { code: "TITLE_TOO_LONG" } });
  });

  it("제목 앞뒤 공백은 잘라서 돌려준다", async () => {
    const res = await createPoll({ ...validPoll, title: "  겨울 여행  " });

    const { poll } = (await res.json()) as { poll: { title: string } };
    expect(poll.title).toBe("겨울 여행");
  });

  it.each([
    ["JSON이 아닌 본문", "this is not json"],
    ["빈 본문", ""],
    ["null", "null"],
    ["배열", "[]"],
  ])("본문이 %s이면 서버 오류 없이 INVALID_REQUEST로 거절한다", async (_label, rawBody) => {
    const res = await api("/api/polls", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${env.ORGANIZER_KEY}` },
      body: rawBody,
    });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: { code: "INVALID_REQUEST" } });
  });

  // 배포 때 비밀값 설정을 깜빡하면 키가 빈 문자열이 된다. 이때 "키 없음"이 통과하면 누구나 조사를 만들 수 있다.
  it.each([
    ["Authorization 헤더가 없어도", undefined],
    ["빈 Bearer 값이어도", "Bearer "],
  ])("서버에 주최자 키가 설정되지 않았으면 %s 거절한다", async (_label, authorization) => {
    const res = await app.fetch(
      new Request("https://example.com/api/polls", {
        method: "POST",
        headers: { "content-type": "application/json", ...(authorization ? { authorization } : {}) },
        body: JSON.stringify(validPoll),
      }),
      { ...env, ORGANIZER_KEY: "" },
    );

    expect(res.status).toBe(401);
  });
});
