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

function organizerHeaders(key: string | null): Record<string, string> {
  return { "content-type": "application/json", ...(key === null ? {} : { authorization: `Bearer ${key}` }) };
}

/** 조사를 마감한다(주최자). body에 confirmedStartDate·confirmedEndDate를 주면 확정 날짜를 함께 정한다. */
export function closePollAs(pollId: string, key: string | null = env.ORGANIZER_KEY, body?: unknown) {
  return api(`/api/polls/${pollId}/close`, {
    method: "POST",
    headers: organizerHeaders(key),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** 다른 테스트의 준비 단계용: 올바른 키로 조사를 마감하고, 실패하면 바로 알린다. */
export async function closePoll(pollId: string) {
  const res = await closePollAs(pollId);
  if (res.status !== 200) throw new Error(`closePoll failed: ${res.status}`);
}

/** 마감된 조사를 다시 연다(주최자). */
export function reopenPoll(pollId: string, key: string | null = env.ORGANIZER_KEY) {
  return api(`/api/polls/${pollId}/reopen`, { method: "POST", headers: organizerHeaders(key) });
}

/** 응답자를 지운다(주최자). 그 사람의 응답과 수정 토큰도 함께 사라진다. */
export function removeRespondent(pollId: string, respondentId: string, key: string | null = env.ORGANIZER_KEY) {
  return api(`/api/polls/${pollId}/respondents/${respondentId}`, { method: "DELETE", headers: organizerHeaders(key) });
}

/** 조사 정보(상태와 확정 날짜 포함)를 읽는다. */
export function readPoll(pollId: string) {
  return api(`/api/polls/${pollId}`);
}

/** 조사에 이름으로 참여한다. */
export function joinPoll(pollId: string, name: unknown) {
  return api(`/api/polls/${pollId}/respondents`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

/** 조사에 참여하고 이후 요청에 쓸 응답자 id와 수정 토큰을 돌려준다. 다른 테스트의 준비 단계용. */
export async function joinAs(pollId: string, name = "민지") {
  const res = await joinPoll(pollId, name);
  const body = (await res.json()) as { respondent: { id: string }; editToken: string };
  return { respondentId: body.respondent.id, token: body.editToken };
}

const answersPath = (pollId: string, respondentId: string) => `/api/polls/${pollId}/respondents/${respondentId}/answers`;

function withToken(token: string | null): Record<string, string> {
  return token === null ? {} : { authorization: `Bearer ${token}` };
}

/** 내 응답 전체를 교체한다. body는 { answers: { "YYYY-MM-DD": 상태 } } 모양이다. */
export function saveAnswers(pollId: string, respondentId: string, token: string | null, body: unknown) {
  return api(answersPath(pollId, respondentId), {
    method: "PUT",
    headers: { "content-type": "application/json", ...withToken(token) },
    body: JSON.stringify(body),
  });
}

/** 수정 링크로 열었을 때 "이 사람이 누구인지" 확인한다. 토큰이 맞아야만 이름을 돌려준다. */
export function readRespondent(pollId: string, respondentId: string, token: string | null) {
  return api(`/api/polls/${pollId}/respondents/${respondentId}`, { headers: withToken(token) });
}

/** 조사의 결과(날짜별 집계와 순위)를 읽는다. 링크만 알면 되므로 토큰이 없다. */
export function readResults(pollId: string) {
  return api(`/api/polls/${pollId}/results`);
}

/** 저장된 내 응답을 읽는다. */
export function readAnswers(pollId: string, respondentId: string, token: string | null) {
  return api(answersPath(pollId, respondentId), { headers: withToken(token) });
}
