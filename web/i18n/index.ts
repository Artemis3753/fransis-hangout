import { ko, type Messages } from "./ko";

// 지금은 한국어만 있다. 영어를 추가할 때는 en.ts를 만들고 아래 표에 한 줄 더하면 된다.
const locales = { ko } satisfies Record<string, Messages>;

export const messages: Messages = locales.ko;

/** "{year}년"처럼 중괄호로 비워 둔 자리에 값을 끼워 넣는다. */
export function format(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => String(params[key] ?? ""));
}

/** 서버 오류 코드를 사용자에게 보여 줄 문장으로 바꾼다. 모르는 코드는 일반 문구로 대신한다. */
export function errorMessage(code: string): string {
  const table: Record<string, string> = messages.errors;
  return table[code] ?? messages.errors.UNKNOWN;
}
