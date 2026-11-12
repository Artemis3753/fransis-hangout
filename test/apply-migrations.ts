import { applyD1Migrations, env } from "cloudflare:test";

// 각 테스트 파일이 시작하기 전에 빈 DB에 스키마를 만든다.
await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
