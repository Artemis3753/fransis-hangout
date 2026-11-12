import { applyD1Migrations, env } from "cloudflare:test";
import { beforeEach } from "vitest";

// 각 테스트 파일이 시작하기 전에 빈 DB에 스키마를 만든다.
await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);

// 플러그인 안내문은 "테스트마다 저장소가 격리된다"고 하지만, 이 정리를 넣기 전에는 harness.test.ts가
// 앞 테스트의 데이터가 남아 있어서 실패했다. 그래서 매 테스트 전에 직접 비운다.
// (지금 harness 테스트는 이 정리가 작동하는지만 증명한다. 플러그인 격리가 왜 안 되는지는 파악하지 않았다.)
// 테이블 이름을 하드코딩하지 않고 DB에서 읽는 이유: 이후 티켓에서 테이블이 늘어도 여기를 고칠 필요가 없게.
// 나중에 만들어진 테이블(자식)부터 지워야 외래키 제약에 걸리지 않는다.
beforeEach(async () => {
  const { results } = await env.DB.prepare(
    `SELECT name FROM sqlite_master
     WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name <> 'd1_migrations'
     ORDER BY rowid DESC`,
  ).all<{ name: string }>();

  await env.DB.batch(results.map(({ name }) => env.DB.prepare(`DELETE FROM "${name}"`)));
});
