import { messages as m } from "./i18n";

// index.html의 <head> 스크립트가 같은 키로 읽는다. 그리기 전에 먼저 적용해야 반대 색이 잠깐 번쩍이지 않는다.
const STORAGE_KEY = "fransis-theme";

type Theme = "light" | "dark";

const sunIcon =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
const moonIcon =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';

const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

// 직접 고른 값이 있으면 그것을, 없으면 OS 설정을 따른다.
function currentTheme(): Theme {
  const chosen = document.documentElement.dataset.theme;
  if (chosen === "light" || chosen === "dark") return chosen;
  return systemDark.matches ? "dark" : "light";
}

/** 라이트/다크를 바꾸는 아이콘 버튼. 고른 값은 이 기기에만 기억한다(저장소가 막혀 있어도 화면은 바뀐다). */
export function buildThemeToggle(): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "theme";

  // 지금이 다크면 해(누르면 라이트), 라이트면 달(누르면 다크)
  const render = () => {
    const dark = currentTheme() === "dark";
    // 아이콘은 위의 고정 문자열이라 사용자 입력이 섞이지 않는다.
    button.innerHTML = dark ? sunIcon : moonIcon;
    button.setAttribute("aria-label", dark ? m.theme.toLight : m.theme.toDark);
  };
  render();

  button.addEventListener("click", () => {
    const next: Theme = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // 저장소가 막힌 환경(시크릿 창 등)에서는 이번 방문에만 적용된다.
    }
    render();
  });

  return button;
}
