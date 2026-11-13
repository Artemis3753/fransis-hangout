export type Poll = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  status: "open" | "closed";
};

export type JoinedRespondent = {
  respondent: { id: string; name: string };
  editToken: string;
};

export type Result<T> = { ok: true; value: T } | { ok: false; code: string };

// 서버는 오류를 { error: { code } } 모양으로만 돌려준다. 화면은 이 코드를 문구로 바꿔 보여 준다.
// 네트워크 자체가 실패한 경우는 서버 코드가 없으므로 화면용 코드 NETWORK로 대신한다.
async function callApi<T>(path: string, init: RequestInit | undefined, pick: (body: any) => T): Promise<Result<T>> {
  let res: Response;
  try {
    res = await fetch(path, init);
  } catch {
    return { ok: false, code: "NETWORK" };
  }
  // 서버에는 닿았지만 JSON이 아닌 응답(예: 5xx 오류 페이지)이면 연결 문제가 아니라 서버 문제다.
  const body = await res.json().catch(() => null);
  if (!res.ok) return { ok: false, code: body?.error?.code ?? "UNKNOWN" };
  if (body === null) return { ok: false, code: "UNKNOWN" };
  return { ok: true, value: pick(body) };
}

export function fetchPoll(id: string): Promise<Result<Poll>> {
  return callApi(`/api/polls/${encodeURIComponent(id)}`, undefined, (body) => body.poll as Poll);
}

export function joinPoll(pollId: string, name: string): Promise<Result<JoinedRespondent>> {
  return callApi(
    `/api/polls/${encodeURIComponent(pollId)}/respondents`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    },
    (body) => body as JoinedRespondent,
  );
}

export type Availability = "preferred" | "available" | "unavailable";
/** 날짜("YYYY-MM-DD")별 상태. 키가 없는 날은 "응답 없음"이다. */
export type Answers = Record<string, Availability>;

/** 하루치 집계. 사람 수는 이름 배열의 길이다. */
export type DayResult = {
  date: string;
  preferred: string[];
  available: string[];
  unavailable: string[];
  /** 이 날에 답하지 않은 참여자 수 */
  unanswered: number;
  /** 답한 사람이 있고, 모두 선호나 가능인 날 */
  unanimous: boolean;
};

export type Results = {
  respondentCount: number;
  /** 하루라도 답한 참여자 수 */
  answeredCount: number;
  days: DayResult[];
  /** 순위가 매겨진 날짜(앞일수록 좋은 후보). 아무도 답하지 않은 날은 없다. */
  ranking: string[];
};

/** 링크를 아는 사람은 누구나 읽을 수 있어서 토큰이 필요 없다. */
export function fetchResults(pollId: string): Promise<Result<Results>> {
  return callApi(`/api/polls/${encodeURIComponent(pollId)}/results`, undefined, (body) => body.results as Results);
}

const answersPath = (pollId: string, respondentId: string) =>
  `/api/polls/${encodeURIComponent(pollId)}/respondents/${encodeURIComponent(respondentId)}/answers`;

// 수정 토큰은 주소가 아니라 헤더로 보낸다. 주소는 기록과 로그에 남기 쉽다.
export function fetchAnswers(pollId: string, respondentId: string, editToken: string): Promise<Result<Answers>> {
  return callApi(
    answersPath(pollId, respondentId),
    { headers: { authorization: `Bearer ${editToken}` } },
    (body) => body.answers as Answers,
  );
}

/** 내 응답 전체를 서버에 보내 이전 응답을 통째로 교체한다. */
export function saveAnswers(
  pollId: string,
  respondentId: string,
  editToken: string,
  answers: Answers,
): Promise<Result<Answers>> {
  return callApi(
    answersPath(pollId, respondentId),
    {
      method: "PUT",
      headers: { "content-type": "application/json", authorization: `Bearer ${editToken}` },
      body: JSON.stringify({ answers }),
    },
    (body) => body.answers as Answers,
  );
}
