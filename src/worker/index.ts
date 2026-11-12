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

// 공개 id가 곧 접근 권한이라서, 추측이 불가능하도록 암호학적 난수 128비트를 쓴다.
function newPollId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

// 키를 글자 단위로 비교하면 응답 시간 차이로 키를 추측할 수 있어서,
// 양쪽을 SHA-256으로 길이를 맞춘 뒤 상수 시간 비교를 쓴다.
async function isOrganizerKeyValid(authorization: string | undefined, expected: string) {
  // 비밀값 설정을 빠뜨리면 expected가 빈 문자열이거나 아예 undefined다. 둘 다 "키 없음"과 일치해 버리므로
  // 무조건 거절한다(fail closed). 타입은 string이지만 운영에서는 설정 누락으로 undefined가 올 수 있다.
  if (!expected) return false;
  const supplied = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "";
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

  // 본문이 JSON이 아니거나 객체가 아니면 서버 오류(500)가 아니라 400으로 돌려준다.
  const body: unknown = await c.req.json().catch(() => null);
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return c.json({ error: { code: "INVALID_REQUEST" } }, 400);
  }
  const input = body as { title?: unknown; startDate?: unknown; endDate?: unknown };
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

export default app;
