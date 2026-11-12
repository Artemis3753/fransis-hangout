import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { createPollId } from "./helpers";

// 이 파일은 앱이 아니라 "테스트 환경"을 검증한다. 다른 테스트들이 서로 깨끗한 DB에서 도는지,
// 즉 앞 테스트가 남긴 데이터가 뒤 테스트에 새지 않는지를 확인한다.
// 확인을 위해 DB를 직접 센다. 두 테스트는 파일 안에서 정의된 순서대로 실행된다는 점에 기댄다.
async function countPolls(): Promise<number> {
  const row = await env.DB.prepare("SELECT COUNT(*) AS n FROM polls").first<{ n: number }>();
  return row?.n ?? -1;
}

describe("테스트 사이의 DB 격리", () => {
  it("1/2: 조사를 하나 만들면 이 테스트 안에서는 1건이 보인다", async () => {
    await createPollId();

    expect(await countPolls()).toBe(1);
  });

  it("2/2: 앞 테스트가 만든 조사는 남아 있지 않다", async () => {
    expect(await countPolls()).toBe(0);
  });
});
