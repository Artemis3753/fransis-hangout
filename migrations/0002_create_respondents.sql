-- 조사에 참여한 사람 한 명. 로그인이 없어서 이름이 곧 식별자이고,
-- 같은 조사 안에서 이름(정규화한 값)이 겹치지 않도록 DB가 직접 막는다.
CREATE TABLE respondents (
  id TEXT PRIMARY KEY,
  poll_id TEXT NOT NULL REFERENCES polls (id),
  display_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  -- 수정 토큰은 원문을 저장하지 않고 SHA-256 해시만 저장한다. DB가 유출돼도 토큰을 쓸 수 없게 하려는 것.
  token_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (poll_id, normalized_name)
);
