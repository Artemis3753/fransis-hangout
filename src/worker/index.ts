import { Hono } from "hono";

const app = new Hono<{ Bindings: Cloudflare.Env }>();

// 정적 파일의 헤더는 public/_headers가 맡고, Worker가 만드는 응답에는 _headers가 적용되지 않으므로
// (Cloudflare 문서) API 응답에는 여기서 직접 붙인다. 오류 응답에도 붙도록 next() 뒤에 설정한다.
app.use("*", async (c, next) => {
  await next();
  c.header("X-Robots-Tag", "noindex, nofollow");
});

const MAX_POLL_DAYS = 92;
const MAX_TITLE_LENGTH = 60;
const MAX_NAME_LENGTH = 20;
const MAX_RESPONDENTS = 30;

// 암호학적 난수를 URL에 넣어도 안전한 문자열(base64url)로 바꾼다.
function randomBase64Url(byteCount: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteCount));
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

// 공개 id가 곧 접근 권한이라서, 추측이 불가능하도록 128비트를 쓴다.
const newPollId = () => randomBase64Url(16);

// 수정 토큰은 "이 응답자 본인"임을 증명하는 비밀이라 256비트로 더 길게 만든다.
const newEditToken = () => randomBase64Url(32);

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

// 요청 본문이 JSON 객체일 때만 돌려준다. JSON이 아니거나 null·배열이면 null이라서,
// 호출한 쪽이 서버 오류(500) 대신 400으로 답할 수 있다.
async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null || Array.isArray(body)) return null;
  return body as Record<string, unknown>;
}

// "Authorization: Bearer <값>" 헤더에서 값만 꺼낸다. 형식이 다르거나 없으면 빈 문자열이다.
function bearerToken(authorization: string | undefined): string {
  return authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "";
}

// 키를 글자 단위로 비교하면 응답 시간 차이로 키를 추측할 수 있어서,
// 양쪽을 SHA-256으로 길이를 맞춘 뒤 상수 시간 비교를 쓴다.
async function isOrganizerKeyValid(authorization: string | undefined, expected: string) {
  // 비밀값 설정을 빠뜨리면 expected가 빈 문자열이거나 아예 undefined다. 둘 다 "키 없음"과 일치해 버리므로
  // 무조건 거절한다(fail closed). 타입은 string이지만 운영에서는 설정 누락으로 undefined가 올 수 있다.
  if (!expected) return false;
  const supplied = bearerToken(authorization);
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(supplied)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ]);
  return crypto.subtle.timingSafeEqual(a, b);
}

// "YYYY-MM-DD" 형식이면서 실제로 존재하는 날짜일 때만 1970-01-01 기준 일 수를 돌려준다.
// 시간대를 아예 빼려고 UTC 자정으로만 계산한다.
function toDayNumber(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const ms = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(ms)) return null;
  // Date는 2월 30일을 3월 2일로 조용히 넘기므로, 되돌려 썼을 때 같은 문자열인지로 존재 여부를 확인한다.
  if (new Date(ms).toISOString().slice(0, 10) !== value) return null;
  return ms / 86_400_000;
}

app.post("/api/polls", async (c) => {
  if (!(await isOrganizerKeyValid(c.req.header("authorization"), c.env.ORGANIZER_KEY))) {
    return c.json({ error: { code: "ORGANIZER_KEY_INVALID" } }, 401);
  }

  const input = await readJsonObject(c.req.raw);
  if (input === null) {
    return c.json({ error: { code: "INVALID_REQUEST" } }, 400);
  }
  // 앞뒤 공백은 의미가 없으니 저장 전에 잘라 낸다.
  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (title === "") {
    return c.json({ error: { code: "TITLE_EMPTY" } }, 400);
  }
  // 이모지처럼 문자열 길이가 2로 세어지는 글자도 한 글자로 세려고 [...title]로 센다.
  if ([...title].length > MAX_TITLE_LENGTH) {
    return c.json({ error: { code: "TITLE_TOO_LONG" } }, 400);
  }

  const startDay = toDayNumber(input.startDate);
  const endDay = toDayNumber(input.endDate);
  if (startDay === null || endDay === null) {
    return c.json({ error: { code: "INVALID_DATE" } }, 400);
  }
  if (endDay < startDay) {
    return c.json({ error: { code: "END_BEFORE_START" } }, 400);
  }
  // 달력이 폰 화면에서 읽을 만한 길이를 유지하게 하려는 상한. 시작일과 종료일을 둘 다 센다.
  if (endDay - startDay + 1 > MAX_POLL_DAYS) {
    return c.json({ error: { code: "PERIOD_TOO_LONG" } }, 400);
  }

  const poll = {
    id: newPollId(),
    title,
    startDate: input.startDate,
    endDate: input.endDate,
    status: "open" as const,
  };

  await c.env.DB.prepare(
    "INSERT INTO polls (id, title, start_date, end_date, created_at) VALUES (?, ?, ?, ?, ?)",
  )
    .bind(poll.id, poll.title, poll.startDate, poll.endDate, new Date().toISOString())
    .run();

  return c.json({ poll }, 201);
});

// 정의되지 않은 경로도 Hono 기본값(일반 텍스트)이 아니라 다른 오류와 같은 코드 모양으로 답한다.
app.notFound((c) => c.json({ error: { code: "NOT_FOUND" } }, 404));

// 링크(공개 id)를 아는 사람은 누구나 읽을 수 있다. 주최자 키는 필요 없다.
app.get("/api/polls/:id", async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT id, title, start_date, end_date, status FROM polls WHERE id = ?",
  )
    .bind(c.req.param("id"))
    .first<{ id: string; title: string; start_date: string; end_date: string; status: "open" | "closed" }>();

  if (row === null) {
    return c.json({ error: { code: "POLL_NOT_FOUND" } }, 404);
  }
  return c.json({
    poll: { id: row.id, title: row.title, startDate: row.start_date, endDate: row.end_date, status: row.status },
  });
});

// 로그인 없이 이름만으로 조사에 참여한다. 링크를 아는 사람은 누구나 할 수 있다.
app.post("/api/polls/:id/respondents", async (c) => {
  const poll = await c.env.DB.prepare("SELECT status FROM polls WHERE id = ?")
    .bind(c.req.param("id"))
    .first<{ status: "open" | "closed" }>();
  if (poll === null) {
    return c.json({ error: { code: "POLL_NOT_FOUND" } }, 404);
  }
  if (poll.status === "closed") {
    return c.json({ error: { code: "POLL_CLOSED" } }, 409);
  }

  const body = await readJsonObject(c.req.raw);
  if (body === null) {
    return c.json({ error: { code: "INVALID_REQUEST" } }, 400);
  }
  // 한글은 같은 글자도 "완성형"과 "자모를 풀어 쓴 형태"로 입력될 수 있어서(Mac 등) NFC로 통일한다.
  // 길이를 세기 전에 통일해야 한다. 풀어 쓴 "한"은 코드 포인트가 3개라서, 먼저 세면 짧은 이름이 거절된다.
  const name = typeof body.name === "string" ? body.name.trim().normalize("NFC") : "";
  if (name === "") {
    return c.json({ error: { code: "NAME_EMPTY" } }, 400);
  }
  if ([...name].length > MAX_NAME_LENGTH) {
    return c.json({ error: { code: "NAME_TOO_LONG" } }, 400);
  }

  // 화면에는 사용자가 쓴 대소문자 그대로 보여 주고, 중복 비교용 이름만 소문자로 맞춘다.
  const respondent = { id: randomBase64Url(16), name };
  const editToken = newEditToken();
  const now = new Date().toISOString();

  try {
    // 인원 수를 따로 세고 넣으면 동시에 들어온 두 요청이 둘 다 통과할 수 있다.
    // 그래서 "30명 미만일 때만 넣는다"를 한 번의 SQL로 처리하고, 들어간 행이 없으면 가득 찬 것으로 본다.
    const result = await c.env.DB.prepare(
      `INSERT INTO respondents (id, poll_id, display_name, normalized_name, token_hash, created_at, updated_at)
       SELECT ?, ?, ?, ?, ?, ?, ?
       WHERE (SELECT COUNT(*) FROM respondents WHERE poll_id = ?) < ?`,
    )
      .bind(
        respondent.id,
        c.req.param("id"),
        name,
        name.toLowerCase(),
        await sha256Hex(editToken),
        now,
        now,
        c.req.param("id"),
        MAX_RESPONDENTS,
      )
      .run();
    if (result.meta.changes === 0) {
      return c.json({ error: { code: "POLL_FULL" } }, 409);
    }
  } catch (error) {
    // 같은 이름이 거의 동시에 들어오는 경우까지 막으려고, 미리 조회하지 않고 DB의 유일성 제약에 맡긴다.
    if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
      return c.json({ error: { code: "NAME_TAKEN" } }, 409);
    }
    throw error;
  }

  return c.json({ respondent, editToken }, 201);
});

// 이 토큰이 정말 이 조사의 이 응답자 것인지 확인한다. 토큰은 DB에 해시로만 있어서 요청의 토큰도 해시해서 비교한다.
// 없는 응답자, 다른 조사, 틀린 토큰을 구분하지 않고 모두 false로 돌려준다(응답자 존재 여부를 알려 주지 않으려는 것).
async function isRespondentToken(db: D1Database, pollId: string, respondentId: string, authorization: string | undefined) {
  const token = bearerToken(authorization);
  if (token === "") return false;
  const row = await db
    .prepare("SELECT 1 AS ok FROM respondents WHERE id = ? AND poll_id = ? AND token_hash = ?")
    .bind(respondentId, pollId, await sha256Hex(token))
    .first();
  return row !== null;
}

const editTokenInvalid = { error: { code: "EDIT_TOKEN_INVALID" } };

const AVAILABILITY_STATES = ["preferred", "available", "unavailable"];

// 저장 요청의 answers({ "YYYY-MM-DD": 상태 })를 모두 검사한다. 하나라도 틀리면 그 오류 코드를 돌려줘서
// 호출한 쪽이 아무것도 저장하지 않게 한다(전부 저장되거나 전부 거절되거나).
function parseAnswers(
  input: unknown,
  startDay: number,
  endDay: number,
): { ok: true; entries: [string, string][] } | { ok: false; code: string } {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, code: "INVALID_REQUEST" };
  }
  const entries = Object.entries(input);
  for (const [date, state] of entries) {
    const day = toDayNumber(date);
    if (day === null) return { ok: false, code: "INVALID_DATE" };
    if (day < startDay || day > endDay) return { ok: false, code: "DATE_OUT_OF_RANGE" };
    if (typeof state !== "string" || !AVAILABILITY_STATES.includes(state)) {
      return { ok: false, code: "INVALID_AVAILABILITY" };
    }
  }
  return { ok: true, entries: entries as [string, string][] };
}

// 개인 수정 링크로 열었을 때 "이 링크가 누구 것인지"를 알려 준다. 링크에는 응답자 id와 토큰만 들어 있어서
// 화면이 인사에 쓸 이름을 여기서 얻는다. 토큰이 맞아야만 답하고, 토큰은 돌려주지 않는다.
// 없는 조사·없는 응답자·틀린 토큰은 모두 같은 401이라서, 이 주소로 응답자가 존재하는지 알아낼 수 없다.
// 조사가 마감돼도 읽기이므로 막지 않는다. 응답자를 지우면(티켓 06) 이 행이 사라져 링크도 함께 무효가 된다.
app.get("/api/polls/:id/respondents/:respondentId", async (c) => {
  const respondentId = c.req.param("respondentId");
  if (!(await isRespondentToken(c.env.DB, c.req.param("id"), respondentId, c.req.header("authorization")))) {
    return c.json(editTokenInvalid, 401);
  }

  const row = (await c.env.DB.prepare("SELECT display_name FROM respondents WHERE id = ?")
    .bind(respondentId)
    .first<{ display_name: string }>())!;
  return c.json({ respondent: { id: respondentId, name: row.display_name } });
});

// 내 응답 전체를 교체한다. 토큰 확인, 마감 확인, 입력 검증을 모두 통과해야 저장한다.
app.put("/api/polls/:id/respondents/:respondentId/answers", async (c) => {
  const respondentId = c.req.param("respondentId");
  if (!(await isRespondentToken(c.env.DB, c.req.param("id"), respondentId, c.req.header("authorization")))) {
    return c.json(editTokenInvalid, 401);
  }

  // 응답자가 이 조사에 속한다는 것은 위 인증에서 확인됐고 외래키가 보장하므로, 조사는 반드시 있다.
  const poll = (await c.env.DB.prepare("SELECT start_date, end_date, status FROM polls WHERE id = ?")
    .bind(c.req.param("id"))
    .first<{ start_date: string; end_date: string; status: "open" | "closed" }>())!;
  // 마감된 조사는 응답을 고칠 수 없다. 읽기(GET)는 막지 않아서 내 응답은 계속 볼 수 있다.
  if (poll.status === "closed") {
    return c.json({ error: { code: "POLL_CLOSED" } }, 409);
  }

  const body = await readJsonObject(c.req.raw);
  if (body === null) {
    return c.json({ error: { code: "INVALID_REQUEST" } }, 400);
  }
  const parsed = parseAnswers(body.answers, toDayNumber(poll.start_date)!, toDayNumber(poll.end_date)!);
  if (!parsed.ok) {
    return c.json({ error: { code: parsed.code } }, 400);
  }

  // 삭제와 삽입을 한 번의 batch(트랜잭션)로 묶어서, 중간에 실패해도 이전 응답이 그대로 남게 한다.
  // 수정 시각(updated_at)도 같은 묶음에서 갱신해서, 응답은 바뀌었는데 시각만 옛날인 상태가 생기지 않게 한다.
  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE respondents SET updated_at = ? WHERE id = ?").bind(new Date().toISOString(), respondentId),
    c.env.DB.prepare("DELETE FROM answers WHERE respondent_id = ?").bind(respondentId),
    ...parsed.entries.map(([date, state]) =>
      c.env.DB.prepare("INSERT INTO answers (respondent_id, date, state) VALUES (?, ?, ?)").bind(respondentId, date, state),
    ),
  ]);

  return c.json({ answers: Object.fromEntries(parsed.entries) });
});

app.get("/api/polls/:id/respondents/:respondentId/answers", async (c) => {
  if (!(await isRespondentToken(c.env.DB, c.req.param("id"), c.req.param("respondentId"), c.req.header("authorization")))) {
    return c.json(editTokenInvalid, 401);
  }

  const { results } = await c.env.DB.prepare("SELECT date, state FROM answers WHERE respondent_id = ? ORDER BY date")
    .bind(c.req.param("respondentId"))
    .all<{ date: string; state: string }>();

  return c.json({ answers: Object.fromEntries(results.map((row) => [row.date, row.state])) });
});

const dayNumberToIso = (dayNumber: number) => new Date(dayNumber * 86_400_000).toISOString().slice(0, 10);

type DayResult = {
  date: string;
  preferred: string[];
  available: string[];
  unavailable: string[];
  unanswered: number;
  unanimous: boolean;
};

// 후보일 순위. 안 되는 사람이 적을수록, 그다음 선호가 많을수록, 그다음 가능이 많을수록 앞이고,
// 전부 같으면 이른 날짜가 앞이다. "안 되는 사람 최소화"를 가장 위에 둔 것은 한 명이라도 못 오는 날을
// 선호가 많다는 이유로 앞세우지 않기 위해서다. 아무도 답하지 않은 날은 비교할 근거가 없어서 순위에서 뺀다.
function rankDays(days: DayResult[]): string[] {
  return days
    .filter((day) => day.preferred.length + day.available.length + day.unavailable.length > 0)
    .sort(
      (a, b) =>
        a.unavailable.length - b.unavailable.length ||
        b.preferred.length - a.preferred.length ||
        b.available.length - a.available.length ||
        // YYYY-MM-DD 문자열은 사전순 비교가 곧 날짜순 비교다.
        (a.date < b.date ? -1 : a.date > b.date ? 1 : 0),
    )
    .map((day) => day.date);
}

// 링크를 아는 사람은 누구나 읽을 수 있다(토큰 없음). 응답마다 이름이 함께 나가는 것은 의도한 동작이다:
// 친구 모임에서 "누가 어느 날 되는지" 보는 것이 이 조사의 목적이다.
app.get("/api/polls/:id/results", async (c) => {
  const pollId = c.req.param("id");
  const poll = await c.env.DB.prepare("SELECT start_date, end_date FROM polls WHERE id = ?")
    .bind(pollId)
    .first<{ start_date: string; end_date: string }>();
  if (poll === null) {
    return c.json({ error: { code: "POLL_NOT_FOUND" } }, 404);
  }

  // 두 조회를 한 번의 batch로 보내서 같은 시점의 데이터로 센다. 따로 보내면 그 사이에 저장이 끼어들어
  // "응답 없음" 수가 어긋날 수 있다. 같은 이름 목록 순서를 쓰려고 정렬 기준(참여 순서)도 같게 둔다.
  const [respondentRows, answerRows] = await c.env.DB.batch([
    c.env.DB.prepare("SELECT id, display_name FROM respondents WHERE poll_id = ? ORDER BY created_at, id").bind(pollId),
    c.env.DB.prepare(
      `SELECT a.respondent_id, a.date, a.state, r.display_name
       FROM answers a JOIN respondents r ON r.id = a.respondent_id
       WHERE r.poll_id = ?
       ORDER BY r.created_at, r.id`,
    ).bind(pollId),
  ]);
  const respondentCount = respondentRows.results.length;
  const answers = answerRows.results as { respondent_id: string; date: string; state: string; display_name: string }[];

  const namesByDate = new Map<string, Record<"preferred" | "available" | "unavailable", string[]>>();
  for (const row of answers) {
    let names = namesByDate.get(row.date);
    if (!names) {
      names = { preferred: [], available: [], unavailable: [] };
      namesByDate.set(row.date, names);
    }
    names[row.state as keyof typeof names].push(row.display_name);
  }

  const days: DayResult[] = [];
  for (let day = toDayNumber(poll.start_date)!; day <= toDayNumber(poll.end_date)!; day++) {
    const date = dayNumberToIso(day);
    const { preferred, available, unavailable } = namesByDate.get(date) ?? { preferred: [], available: [], unavailable: [] };
    const answered = preferred.length + available.length + unavailable.length;
    days.push({
      date,
      preferred,
      available,
      unavailable,
      unanswered: respondentCount - answered,
      // 답한 사람이 없는 날은 "모두 된다"가 아니라 "모른다"라서 제외한다.
      unanimous: answered > 0 && unavailable.length === 0,
    });
  }

  return c.json({
    results: {
      respondentCount,
      answeredCount: new Set(answers.map((row) => row.respondent_id)).size,
      days,
      ranking: rankDays(days),
    },
  });
});

export default app;
