import type { DayResult, Results } from "./api";
import { buildMonths, node, SYMBOL, toIso, weekdayOf } from "./calendar";
import { format, messages as m } from "./i18n";

// 추천 날짜는 몇 개만 보여 준다. 조사 기간(최대 92일) 전체를 순위로 늘어놓으면 "가장 좋은 날"이 묻힌다.
const BEST_DAY_COUNT = 5;

const countOf = (day: DayResult) => ({
  preferred: day.preferred.length,
  available: day.available.length,
  unavailable: day.unavailable.length,
});

function dateParts(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return { month, day, weekday: m.calendar.weekdays[weekdayOf(year, month, day)] };
}

/** 선택한 날의 상세: 상태마다 누가 골랐는지 이름으로 보여 준다. 이름은 사용자 입력이라 항상 textContent로 넣는다. */
function renderDetail(panel: HTMLElement, day: DayResult, onClose: () => void) {
  const header = node("div", "detail-header");
  const close = node("button", "detail-close", m.results.close);
  close.type = "button";
  close.addEventListener("click", onClose);
  header.append(node("strong", "detail-title", format(m.results.detailTitle, dateParts(day.date))), close);

  const list = node("dl", "detail-list");
  for (const state of ["preferred", "available", "unavailable"] as const) {
    const names = day[state];
    list.append(
      node("dt", "detail-state", `${SYMBOL[state]} ${m.availability[state]} ${names.length}`),
      node("dd", "detail-names", names.length > 0 ? names.join(", ") : m.results.nobody),
    );
  }

  panel.replaceChildren(header, list, node("p", "detail-unanswered", format(m.results.unansweredCount, { count: day.unanswered })));
  panel.hidden = false;
}

/** 조사 결과 화면: 응답 현황, 추천 날짜, 날짜별 집계 달력, 날짜를 누르면 나오는 상세 패널. */
export function buildResults(poll: { startDate: string; endDate: string }, results: Results): HTMLElement {
  const root = node("div", "results");
  root.append(
    node("p", "results-progress", format(m.results.progress, { total: results.respondentCount, answered: results.answeredCount })),
  );

  if (results.respondentCount === 0 || results.answeredCount === 0) {
    root.append(node("p", "muted", results.respondentCount === 0 ? m.results.noRespondents : m.results.noAnswers));
    return root;
  }

  const byDate = new Map(results.days.map((day) => [day.date, day]));
  const cells = new Map<string, HTMLButtonElement>();

  // 아래에 고정되는 패널이라, 위쪽 달력을 보다가 날짜를 눌러도 상세가 화면 밖으로 밀려나지 않는다.
  // aria-live로 스크린리더에게도 바뀐 내용을 읽어 준다.
  const panel = node("section", "detail");
  panel.hidden = true;
  panel.setAttribute("aria-live", "polite");

  let selected: string | undefined;
  const select = (date: string | undefined) => {
    if (selected) cells.get(selected)?.setAttribute("aria-pressed", "false");
    selected = date;
    if (date === undefined) {
      panel.hidden = true;
      return;
    }
    cells.get(date)?.setAttribute("aria-pressed", "true");
    renderDetail(panel, byDate.get(date)!, () => select(undefined));
  };

  // 같은 날을 다시 누르면 닫는다. 목록에서 눌러도 같은 패널을 쓴다.
  const toggle = (date: string) => select(selected === date ? undefined : date);

  // 추천 날짜
  const bestDays = results.ranking.slice(0, BEST_DAY_COUNT).map((date) => byDate.get(date)!);
  const best = node("ol", "best-list");
  for (const day of bestDays) {
    const item = node("li", "best-item");
    const button = node("button", "best-button");
    button.type = "button";
    const parts = dateParts(day.date);
    button.append(
      node("span", "best-date", format(m.results.detailTitle, parts)),
      node("span", "best-counts", format(m.results.counts, countOf(day))),
    );
    if (day.unanimous) button.append(node("span", "badge", m.results.unanimous));
    button.addEventListener("click", () => toggle(day.date));
    item.append(button);
    best.append(item);
  }
  root.append(node("h3", "results-subheading", m.results.bestHeading), node("p", "muted small", m.results.bestHint), best);

  // 날짜별 집계 달력. 칸은 좁아서 숫자 두 개(올 수 있는 사람, 못 오는 사람)만 넣고, 나머지는 눌러서 본다.
  root.append(node("p", "muted small", m.results.gridLegend), node("p", "muted small", m.results.gridHint));
  const months = buildMonths(poll, (year, month, day) => {
    const date = toIso(year, month, day);
    const result = byDate.get(date)!;
    const counts = countOf(result);

    const button = node("button", "day result-day");
    button.type = "button";
    button.setAttribute("aria-pressed", "false");
    button.setAttribute(
      "aria-label",
      format(m.results.cellLabel, { month, day, weekday: m.calendar.weekdays[weekdayOf(year, month, day)], ...counts, unanswered: result.unanswered }),
    );
    if (result.unanimous) button.dataset.unanimous = "true";

    const can = counts.preferred + counts.available;
    button.append(
      node("span", "day-number", String(day)),
      node("span", "result-can", can > 0 ? `${SYMBOL.available}${can}` : ""),
      node("span", "result-no", counts.unavailable > 0 ? `${SYMBOL.unavailable}${counts.unavailable}` : ""),
    );
    button.addEventListener("click", () => toggle(date));
    cells.set(date, button);
    return button;
  });
  root.append(...months, panel);
  return root;
}
