-- 조사(poll) 한 건. 날짜는 시간대 없는 달력 날짜 문자열(YYYY-MM-DD)로 저장한다.
CREATE TABLE polls (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  confirmed_start_date TEXT,
  confirmed_end_date TEXT,
  created_at TEXT NOT NULL
);
