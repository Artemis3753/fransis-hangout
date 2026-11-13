// 개인 수정 링크: /p/<조사id>#edit=<응답자id>.<수정 토큰>
// 비밀(토큰)을 주소의 # 뒤에 두는 이유: 브라우저는 # 뒤를 서버로 보내지 않고 Referer에도 싣지 않아서,
// 서버 로그나 다른 사이트로 새지 않는다. id와 토큰은 base64url이라 "."이 들어갈 수 없어서 구분자로 쓴다.
const HASH_PATTERN = /^#edit=([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/;

export function buildEditLink(pollId: string, respondentId: string, editToken: string): string {
  return `${location.origin}/p/${encodeURIComponent(pollId)}#edit=${respondentId}.${editToken}`;
}

export type EditLink = { respondentId: string; editToken: string };

/**
 * 주소의 # 부분을 해석한다. 수정 링크가 아니면 null, 수정 링크처럼 생겼지만 모양이 깨졌으면 "malformed"다.
 * 복사하다 잘린 링크를 "링크가 아님"으로 넘기지 않고 오류로 알려 주려고 둘을 나눈다.
 */
export function parseEditHash(hash: string): EditLink | "malformed" | null {
  if (!hash.startsWith("#edit=")) return null;
  const match = HASH_PATTERN.exec(hash);
  return match ? { respondentId: match[1], editToken: match[2] } : "malformed";
}
