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
  try {
    const res = await fetch(path, init);
    const body = await res.json();
    if (!res.ok) return { ok: false, code: body?.error?.code ?? "UNKNOWN" };
    return { ok: true, value: pick(body) };
  } catch {
    return { ok: false, code: "NETWORK" };
  }
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
