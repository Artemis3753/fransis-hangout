import "./style.css";
import { fetchPoll, joinPoll, type Poll } from "./api";
import { errorMessage, format, messages as m } from "./i18n";
import { loadRespondent, saveRespondent } from "./storage";

// "2026-12-01" → "2026년 12월 1일". Date 객체를 거치지 않아서 보는 사람의 시간대와 무관하다.
function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return format(m.date.full, { year, month, day });
}

// 조사 제목과 참여자 이름은 사용자가 입력한 값이라 innerHTML에 넣으면 스크립트가 실행될 수 있다.
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

// 이름 입력 폼. 참여에 성공하면 이 기기에 기억시키고 onJoined를 불러 화면을 바꾼다.
function buildJoinForm(poll: Poll, onJoined: () => void): HTMLFormElement {
  const form = el("form", undefined, "join-form");

  const label = el("label", m.join.nameLabel);
  label.htmlFor = "respondent-name";

  const input = el("input");
  input.id = "respondent-name";
  input.name = "name";
  input.type = "text";
  // 글자 수 제한(maxLength)은 일부러 걸지 않는다. 브라우저는 UTF-16 단위로 세고 서버는 글자 단위로 세서
  // 기준이 어긋나고, 한도 숫자가 한 곳 더 늘어난다. 길면 서버가 NAME_TOO_LONG으로 안내한다.
  input.autocomplete = "off";
  input.placeholder = m.join.namePlaceholder;

  const button = el("button", m.join.submit);
  button.type = "submit";

  // 오류는 스크린리더가 바로 읽어 주도록 role=alert 영역에 둔다.
  const error = el("p", undefined, "error");
  error.setAttribute("role", "alert");

  form.append(label, input, button, error);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    button.disabled = true;
    button.textContent = m.join.submitting;
    error.textContent = "";

    const result = await joinPoll(poll.id, input.value);
    if (result.ok) {
      const { respondent, editToken } = result.value;
      saveRespondent(poll.id, { id: respondent.id, name: respondent.name, editToken });
      onJoined();
      return;
    }

    error.textContent = errorMessage(result.code);
    button.disabled = false;
    button.textContent = m.join.submit;
  });

  return form;
}

// 참여 영역은 상태에 따라 셋 중 하나다: 이미 참여함 / 마감됨 / 이름 입력 폼.
function renderParticipation(poll: Poll, container: HTMLElement) {
  const stored = loadRespondent(poll.id);
  if (stored) {
    container.replaceChildren(el("p", format(m.join.joined, { name: stored.name }), "joined"));
  } else if (poll.status === "closed") {
    container.replaceChildren(el("p", m.poll.closed, "muted"));
  } else {
    container.replaceChildren(buildJoinForm(poll, () => renderParticipation(poll, container)));
  }
}

function showPoll(poll: Poll) {
  const period = el("p", undefined, "period");
  period.append(
    el("span", m.poll.periodLabel, "period-label"),
    el("strong", format(m.date.range, { start: formatDate(poll.startDate), end: formatDate(poll.endDate) })),
  );

  const participation = el("section", undefined, "participation");
  renderParticipation(poll, participation);

  show(el("h1", poll.title), period, participation);
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
