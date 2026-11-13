import { describe, expect, it } from "vitest";
import { ko } from "../web/i18n/ko";
import { api, createPoll, createPollId, validPoll } from "./helpers";

// KakaoTalk의 링크 미리보기 수집기는 자바스크립트를 실행하지 않고 서버가 내려준 HTML만 읽는다.
// 그래서 조사 제목과 설명은 화면 코드가 아니라 서버가 돌려주는 HTML 안에 있어야 한다.
async function page(path: string) {
  const res = await api(path);
  return { res, html: await res.text() };
}

describe("링크 미리보기용 조사 페이지", () => {
  it("조사 제목과 설명이 서버가 내려주는 HTML에 들어 있다", async () => {
    const pollId = await createPollId(); // 제목 "겨울 여행"

    const { res, html } = await page(`/p/${pollId}`);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(html).toContain(`<title>겨울 여행 · ${ko.app.title}</title>`);
    expect(html).toContain('<meta property="og:title" content="겨울 여행">');
    expect(html).toContain(`<meta property="og:description" content="${ko.share.description}">`);
    expect(html).toContain(`<meta property="og:site_name" content="${ko.app.title}">`);
    expect(html).toContain(`<meta property="og:url" content="https://example.com/p/${pollId}">`);
    expect(html).toContain('<meta property="og:type" content="website">');
  });

  it("끝에 슬래시가 있는 주소도 같다", async () => {
    const pollId = await createPollId();

    const { html } = await page(`/p/${pollId}/`);

    expect(html).toContain('<meta property="og:title" content="겨울 여행">');
  });

  it("검색 노출 차단은 이 페이지에도 그대로 걸려 있다", async () => {
    const pollId = await createPollId();

    const { res, html } = await page(`/p/${pollId}`);

    expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect(html).toContain('<meta name="robots" content="noindex, nofollow"');
  });

  it("제목에 HTML이나 따옴표가 있어도 태그로 해석되지 않고 글자 그대로 들어간다", async () => {
    const title = `"><script>alert(1)</script> & '`;
    const created = await createPoll({ ...validPoll, title });
    const { poll } = (await created.json()) as { poll: { id: string } };

    const { html } = await page(`/p/${poll.id}`);

    // 원문 그대로 들어가면 <script> 태그가 살아난다. 이스케이프된 형태만 있어야 한다.
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain('content="&quot;&gt;&lt;script&gt;');
  });

  it("없는 조사는 오류가 아니라 일반 화면을 돌려주고, 다른 조사의 정보를 싣지 않는다", async () => {
    const { res, html } = await page("/p/no-such-poll");

    expect(res.status).toBe(200);
    expect(html).not.toContain("og:title");
    expect(html).toContain('id="app"');
  });

  it("조사 주소가 아닌 경로는 건드리지 않는다", async () => {
    const { html: home } = await page("/");
    const { html: deep } = await page("/p/a/b");

    expect(home).not.toContain("og:title");
    expect(deep).not.toContain("og:title");
  });
});
