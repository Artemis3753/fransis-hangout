import { env } from "cloudflare:test";
import { exports } from "cloudflare:workers";

// 서버 앞문(HTTP 요청 → 응답)으로만 확인한다. 내부 함수나 DB를 직접 건드리지 않는다.
// (비밀값이 빠진 배포를 흉내 낼 때만 app.fetch에 바인딩을 직접 넘기지만, 이것도 요청 → 응답 경계다.)
export function api(path: string, init?: RequestInit) {
  return exports.default.fetch(new Request(`https://example.com${path}`, init));
}

export function createPoll(body: unknown, key: string | null = env.ORGANIZER_KEY) {
  return api("/api/polls", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(key === null ? {} : { authorization: `Bearer ${key}` }),
    },
    body: JSON.stringify(body),
  });
}

export const validPoll = { title: "겨울 여행", startDate: "2026-12-01", endDate: "2027-01-31" };

/** 유효한 조사를 하나 만들고 공개 id만 돌려준다. 다른 테스트의 준비 단계용. */
export async function createPollId(): Promise<string> {
  const res = await createPoll(validPoll);
  const { poll } = (await res.json()) as { poll: { id: string } };
  return poll.id;
}

/** 조사에 이름으로 참여한다. */
export function joinPoll(pollId: string, name: unknown) {
  return api(`/api/polls/${pollId}/respondents`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name }),
  });
}
