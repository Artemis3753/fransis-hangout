// wrangler types가 만드는 Env에 없는 값(비밀값, 테스트 전용 바인딩)을 보충한다.
declare namespace Cloudflare {
  interface Env {
    ORGANIZER_KEY: string;
    TEST_MIGRATIONS: import("@cloudflare/vitest-plugin").D1Migration[];
  }
}
