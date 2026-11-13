-- 응답자가 날짜마다 고른 상태. "응답 없음"은 행이 없는 것으로 표현하므로 상태는 세 가지뿐이다.
-- (응답자, 날짜)가 기본키라서 하루에 응답이 둘 생길 수 없다.
-- 응답자가 지워지면 그 사람의 응답도 함께 지워져야 해서(이후 티켓의 응답자 삭제) CASCADE를 둔다.
-- SQLite는 나중에 외래키를 바꾸기 어려워서 지금 정해 둔다.
CREATE TABLE answers (
  respondent_id TEXT NOT NULL REFERENCES respondents (id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('preferred', 'available', 'unavailable')),
  PRIMARY KEY (respondent_id, date)
);
