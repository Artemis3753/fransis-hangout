import type { Answers, Availability } from "./api";
import { format, messages as m } from "./i18n";

// 탭할 때마다 이 순서로 돈다. 마지막 undefined가 "응답 없음"이다.
const CYCLE: (Availability | undefined)[] = ["preferred", "available", "unavailable", undefined];

// 색을 구분하기 어려운 사람도 알아볼 수 있게, 색과 별개로 모양이 다른 기호를 함께 쓴다.
export const SYMBOL: Record<Availability, string> = { preferred: "★", available: "○", unavailable: "✕" };

function nextState(current: Availability | undefined): Availability | undefined {
  return CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length];
}

// 날짜는 보는 사람의 시간대와 상관없어야 해서, Date는 UTC 메서드로만 쓴다.
const pad = (n: number) => String(n).padStart(2, "0");
export const toIso = (year: number, month: number, day: number) => `${year}-${pad(month)}-${pad(day)}`;
const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();
export const weekdayOf = (year: number, month: number, day: number) => new Date(Date.UTC(year, month - 1, day)).getUTCDay();

function stateLabel(state: Availability | undefined): string {
  return state ? m.availability[state] : m.availability.none;
}

export function node<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

export type CalendarOptions = {
  startDate: string;
  endDate: string;
  /** 달력이 직접 고친다. 저장할 때 이 객체를 그대로 서버에 보낸다. */
  answers: Answers;
  readOnly: boolean;
  onChange: () => void;
};

function buildDay(year: number, month: number, day: number, options: CalendarOptions): HTMLButtonElement {
  const iso = toIso(year, month, day);
  const button = node("button", "day");
  button.type = "button";
  const symbol = node("span", "day-symbol");
  button.append(node("span", "day-number", String(day)), symbol);

  const weekday = m.calendar.weekdays[weekdayOf(year, month, day)];

  // 상태가 바뀔 때마다 색(data-state), 기호, 읽어 주는 이름을 한꺼번에 맞춘다.
  const render = () => {
    const state = options.answers[iso];
    if (state) button.dataset.state = state;
    else delete button.dataset.state;
    symbol.textContent = state ? SYMBOL[state] : "";
    button.setAttribute("aria-label", format(m.day.label, { month, day, weekday, state: stateLabel(state) }));
  };
  render();

  if (options.readOnly) {
    button.disabled = true;
  } else {
    button.addEventListener("click", () => {
      const next = nextState(options.answers[iso]);
      if (next) options.answers[iso] = next;
      else delete options.answers[iso];
      render();
      options.onChange();
    });
  }
  return button;
}

type DayRange = { startDate: string; endDate: string };
type MakeDay = (year: number, month: number, day: number) => HTMLElement;

function buildMonth(year: number, month: number, range: DayRange, makeDay: MakeDay): HTMLElement {
  const section = node("section", "month");
  section.append(node("h2", "month-title", format(m.calendar.month, { year, month })));

  const weekdays = node("div", "weekdays");
  for (const name of m.calendar.weekdays) weekdays.append(node("span", "weekday", name));

  const grid = node("div", "days");
  // 1일이 무슨 요일인지만큼 앞을 비워서 요일 칸에 맞춘다.
  for (let i = 0; i < weekdayOf(year, month, 1); i++) grid.append(node("span", "day blank"));

  for (let day = 1; day <= daysInMonth(year, month); day++) {
    const iso = toIso(year, month, day);
    // YYYY-MM-DD 문자열은 사전순 비교가 곧 날짜순 비교다.
    if (iso < range.startDate || iso > range.endDate) {
      grid.append(node("span", "day outside", String(day)));
    } else {
      grid.append(makeDay(year, month, day));
    }
  }

  section.append(weekdays, grid);
  return section;
}

function buildLegend(): HTMLElement {
  const legend = node("ul", "legend");
  for (const state of ["preferred", "available", "unavailable"] as const) {
    const item = node("li", "legend-item");
    // 칩 색이 달력 칸의 상태 색과 같아지도록 CSS가 이 값을 본다.
    item.dataset.state = state;
    item.append(node("span", "legend-symbol", SYMBOL[state]), document.createTextNode(m.availability[state]));
    legend.append(item);
  }
  return legend;
}

/**
 * 조사 기간이 걸친 달마다 월 달력을 하나씩 만든다. 기간 밖의 날짜는 눌러도 반응하지 않는 빈 칸이다.
 * 기간 안의 날짜 칸이 무엇인지(응답 버튼인지, 결과 칸인지)는 makeDay가 정해서, 응답 화면과 결과 화면이 같은 배치를 쓴다.
 */
export function buildMonths(range: DayRange, makeDay: MakeDay): HTMLElement[] {
  const months: HTMLElement[] = [];
  let [year, month] = range.startDate.split("-").map(Number);
  const [endYear, endMonth] = range.endDate.split("-").map(Number);
  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push(buildMonth(year, month, range, makeDay));
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return months;
}

/** 내 응답을 고르는 달력. */
export function buildCalendar(options: CalendarOptions): HTMLElement {
  const root = node("div", "calendar");
  root.append(buildLegend(), ...buildMonths(options, (year, month, day) => buildDay(year, month, day, options)));
  return root;
}
