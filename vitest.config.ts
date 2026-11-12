import path from "node:path";
import { defineConfig } from "vitest/config";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";

export default defineConfig(async () => {
  // 테스트용 DB를 손으로 만든 스키마가 아니라 실제 마이그레이션 SQL로 만든다. 그래야 운영과 같은 스키마로 돌고,
  // 이후 티켓에서 유일성 같은 제약이 추가되면 같은 경로로 함께 검증된다.
  const migrations = await readD1Migrations(path.join(import.meta.dirname, "migrations"));

  return {
    plugins: [
      cloudflareTest({
        wrangler: { configPath: "./wrangler.jsonc" },
        miniflare: {
          bindings: {
            // 운영에서는 `wrangler secret put`으로 넣는 값. 테스트용 값은 여기서만 정한다.
            ORGANIZER_KEY: "test-organizer-key",
            TEST_MIGRATIONS: migrations,
          },
        },
      }),
    ],
    test: {
      setupFiles: ["./test/apply-migrations.ts"],
    },
  };
});
