import "./style.css";
import { fetchAnswers, fetchPoll, fetchRespondent, fetchResults, joinPoll, saveAnswers, type Answers, type Poll } from "./api";
import { buildCalendar } from "./calendar";
import { errorMessage, format, messages as m } from "./i18n";
import { buildEditLink, parseEditHash } from "./editLink";
import { buildResults } from "./results";
import { loadRespondent, saveRespondent, type StoredRespondent } from "./storage";

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

// 개인 수정 링크와 복사 버튼. 링크는 읽기 전용 입력칸에도 보여 준다. 앱 안 브라우저처럼 클립보드가 막힌 곳에서도
// 길게 눌러 직접 복사할 수 있게 하려는 것이다.
function buildEditLinkBox(link: string): HTMLElement {
  const box = el("section", undefined, "edit-link");

  const input = el("input");
  input.readOnly = true;
  input.value = link;
  input.setAttribute("aria-label", m.editLink.heading);
  // 탭하면 전체가 선택돼서 바로 복사할 수 있다.
  input.addEventListener("focus", () => input.select());

  const button = el("button", m.editLink.copy);
  button.type = "button";

  const status = el("p", undefined, "status");
  status.setAttribute("role", "status");

  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(link);
      status.className = "status ok";
      status.textContent = m.editLink.copied;
    } catch {
      input.select();
      status.className = "status error";
      status.textContent = m.editLink.copyFailed;
    }
  });

  const row = el("div", undefined, "edit-link-row");
  row.append(input, button);
  box.append(el("h3", m.editLink.heading), el("p", m.editLink.body, "muted small"), row, status);
  return box;
}

// 참여한 사람에게 보여 주는 화면: 인사, 달력, 저장 버튼. 마감된 조사는 달력을 읽기 전용으로 보여 준다.
async function renderAnswering(poll: Poll, who: StoredRespondent, container: HTMLElement, onSaved: () => void) {
  const greeting = el("p", format(m.join.joined, { name: who.name }), "joined");
  container.replaceChildren(greeting, el("p", m.answers.loading, "muted"));

  const loaded = await fetchAnswers(poll.id, who.id, who.editToken);
  if (!loaded.ok) {
    container.replaceChildren(greeting, el("p", errorMessage(loaded.code), "error"));
    return;
  }

  // 달력이 이 객체를 직접 고치고, 저장할 때 통째로 서버에 보낸다.
  const answers: Answers = { ...loaded.value };
  const closed = poll.status === "closed";

  // 저장 결과를 알리는 자리. 스크린리더가 바뀔 때 읽어 주도록 role=status를 둔다.
  const status = el("p", undefined, "status");
  status.setAttribute("role", "status");

  const calendar = buildCalendar({
    startDate: poll.startDate,
    endDate: poll.endDate,
    answers,
    readOnly: closed,
    // 고치는 순간 "저장했어요"가 남아 있으면 저장된 것으로 오해하니 지운다.
    onChange: () => {
      status.textContent = "";
    },
  });

  const parts: HTMLElement[] = [greeting, el("p", m.calendar.hint, "muted"), calendar];

  // 수정 링크는 "한 번이라도 저장한 사람"에게만 의미가 있다. 이미 저장한 응답이 있으면 처음부터, 없으면 첫 저장 직후에 보인다.
  const editLinkSlot = el("div");
  const showEditLink = () => editLinkSlot.replaceChildren(buildEditLinkBox(buildEditLink(poll.id, who.id, who.editToken)));
  if (!closed && Object.keys(answers).length > 0) showEditLink();

  if (closed) {
    parts.push(el("p", m.answers.closedNote, "muted"));
  } else {
    const button = el("button", m.answers.save, "save");
    button.type = "button";
    button.addEventListener("click", async () => {
      button.disabled = true;
      button.textContent = m.answers.saving;
      status.textContent = "";

      const result = await saveAnswers(poll.id, who.id, who.editToken, answers);
      status.className = result.ok ? "status ok" : "status error";
      status.textContent = result.ok ? m.answers.saved : errorMessage(result.code);
      if (result.ok) {
        showEditLink();
        onSaved();
      }

      button.disabled = false;
      button.textContent = m.answers.save;
    });
    parts.push(button, status, editLinkSlot);
  }

  container.replaceChildren(...parts);
}

// 참여 영역은 상태에 따라 셋 중 하나다: 이미 참여함 / 마감됨 / 이름 입력 폼.
// onChanged는 참여하거나 응답을 저장한 직후 불린다. 결과 화면이 내 변경을 바로 보여 주게 하려는 것이다.
function renderParticipation(poll: Poll, container: HTMLElement, onChanged: () => void) {
  const stored = loadRespondent(poll.id);
  if (stored) {
    void renderAnswering(poll, stored, container, onChanged);
  } else if (poll.status === "closed") {
    container.replaceChildren(el("p", m.poll.closed, "muted"), el("p", m.editLink.unrecognizedClosed, "muted"));
  } else {
    container.replaceChildren(
      buildJoinForm(poll, () => {
        renderParticipation(poll, container, onChanged);
        onChanged();
      }),
      el("p", m.editLink.unrecognized, "muted small"),
    );
  }
}

// 결과는 열 때 한 번 불러온다(실시간 갱신은 없다). 다시 불러올 때는 이전 화면을 그대로 두고 완료되면 바꿔서 깜빡이지 않게 한다.
async function renderResults(poll: Poll, container: HTMLElement) {
  if (!container.hasChildNodes()) {
    container.replaceChildren(el("h2", m.results.heading), el("p", m.results.loading, "muted"));
  }
  const loaded = await fetchResults(poll.id);
  container.replaceChildren(
    el("h2", m.results.heading),
    loaded.ok ? buildResults(poll, loaded.value) : el("p", errorMessage(loaded.code), "error"),
  );
}

function showPoll(poll: Poll, notice?: string) {
  const period = el("p", undefined, "period");
  period.append(
    el("span", m.poll.periodLabel, "period-label"),
    el("strong", format(m.date.range, { start: formatDate(poll.startDate), end: formatDate(poll.endDate) })),
  );

  const results = el("section", undefined, "results-section");
  const participation = el("section", undefined, "participation");
  renderParticipation(poll, participation, () => void renderResults(poll, results));
  void renderResults(poll, results);

  // 수정 링크 처리 결과(잘못된 링크)는 이름 입력 폼 위에 오류로 보여 준다.
  show(el("h1", poll.title), period, ...(notice ? [el("p", notice, "error")] : []), participation, results);
}

// 주소에 개인 수정 링크(#edit=...)가 있으면 서버로 확인하고, 맞으면 이 브라우저에 기억시킨다.
// 틀린 링크는 아무것도 바꾸지 않는다(이미 기억된 참여 기록도 그대로 둔다). 돌려주는 값은 화면에 띄울 오류 문구다.
async function restoreFromEditLink(pollId: string): Promise<string | undefined> {
  const link = parseEditHash(location.hash);
  if (link === null) return undefined;
  // 처리가 끝나면 비밀이 주소창과 방문 기록에 남지 않도록 주소에서 지운다. 맞는 링크는 이미 기기에 저장된다.
  history.replaceState(null, "", location.pathname + location.search);
  if (link === "malformed") return m.editLink.invalid;

  const result = await fetchRespondent(pollId, link.respondentId, link.editToken);
  if (!result.ok) {
    return result.code === "EDIT_TOKEN_INVALID" ? m.editLink.invalid : errorMessage(result.code);
  }
  saveRespondent(pollId, { id: result.value.id, name: result.value.name, editToken: link.editToken });
  return undefined;
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
    showPoll(result.value, await restoreFromEditLink(result.value.id));
  } else if (result.code === "POLL_NOT_FOUND") {
    showMessage(m.notFound.heading, m.notFound.body);
  } else {
    // 네트워크 문제 같은 오류에 "조사를 찾을 수 없어요"라고 말하면 사실과 달라서 제목을 따로 쓴다.
    showMessage(m.problem.heading, errorMessage(result.code));
  }
}

main();
