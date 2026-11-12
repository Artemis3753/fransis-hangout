import "./style.css";
import { errorMessage, format, messages as m } from "./i18n";

type Poll = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  status: "open" | "closed";
};

type Result<T> = { ok: true; value: T } | { ok: false; code: string };

// 서버는 오류를 { error: { code } } 모양으로만 돌려준다. 화면은 이 코드를 문구로 바꿔 보여 준다.
async function fetchPoll(id: string): Promise<Result<Poll>> {
  try {
    const res = await fetch(`/api/polls/${encodeURIComponent(id)}`);
    const body = await res.json();
    if (!res.ok) return { ok: false, code: body?.error?.code ?? "UNKNOWN" };
    return { ok: true, value: body.poll as Poll };
  } catch {
    return { ok: false, code: "NETWORK" };
  }
}

// "2026-12-01" → "2026년 12월 1일". Date 객체를 거치지 않아서 보는 사람의 시간대와 무관하다.
function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return format(m.date.full, { year, month, day });
}

// 조사 제목은 사용자가 입력한 값이라 innerHTML에 넣으면 스크립트가 실행될 수 있다.
// 그래서 텍스트는 항상 textContent로만 넣는다.
function el<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, className?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function show(...nodes: HTMLElement[]) {
  const app = document.getElementById("app")!;
  app.replaceChildren(el("p", m.app.title, "site-name"), ...nodes);
}

function showMessage(heading: string, body: string) {
  show(el("h1", heading), el("p", body, "muted"));
}

function showPoll(poll: Poll) {
  const period = el("p", undefined, "period");
  period.append(
    el("span", m.poll.periodLabel, "period-label"),
    el("strong", format(m.date.range, { start: formatDate(poll.startDate), end: formatDate(poll.endDate) })),
  );
  show(el("h1", poll.title), period);
}

async function main() {
  document.title = m.app.title;

  const match = location.pathname.match(/^\/p\/([^/]+)\/?$/);
  if (!match) {
    // 사이트 이름은 show()가 이미 맨 위에 넣으므로, 제목을 한 번 더 쓰지 않는다.
    show(el("p", m.home.message, "muted"));
    return;
  }

  // 링크가 잘려서 "%E0%A4%A"처럼 깨진 퍼센트 인코딩이 오면 decodeURIComponent가 예외를 던진다.
  // 이때 화면이 "불러오는 중"에서 멈추지 않고 "찾을 수 없음" 안내로 가게 한다.
  let id: string;
  try {
    id = decodeURIComponent(match[1]);
  } catch {
    showMessage(m.notFound.heading, m.notFound.body);
    return;
  }

  show(el("p", m.poll.loading, "muted"));
  const result = await fetchPoll(id);

  if (result.ok) {
    document.title = `${result.value.title} · ${m.app.title}`;
    showPoll(result.value);
  } else if (result.code === "POLL_NOT_FOUND") {
    showMessage(m.notFound.heading, m.notFound.body);
  } else {
    // 네트워크 문제 같은 오류에 "조사를 찾을 수 없어요"라고 말하면 사실과 달라서 제목을 따로 쓴다.
    showMessage(m.problem.heading, errorMessage(result.code));
  }
}

main();
