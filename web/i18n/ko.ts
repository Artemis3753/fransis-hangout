// 화면에 보이는 모든 문구의 한국어판. 영어를 추가할 때는 이 객체와 같은 모양의 en.ts만 만들면 된다.
// (as const를 쓰지 않는 이유: 다른 언어 파일이 같은 "모양"만 맞추면 되고 글자까지 같을 필요는 없어서)
export const ko = {
  app: {
    title: "프란시스 아지트",
  },
  date: {
    // 시간대 문제를 피하려고 Date 객체 대신 연·월·일 숫자를 이 틀에 끼워 넣는다.
    full: "{year}년 {month}월 {day}일",
    range: "{start} ~ {end}",
  },
  poll: {
    loading: "불러오는 중…",
    periodLabel: "후보 기간",
  },
  home: {
    message: "초대받은 링크로 들어와 주세요.",
  },
  notFound: {
    heading: "조사를 찾을 수 없어요",
    body: "링크가 맞는지 확인해 주세요.",
  },
  problem: {
    heading: "문제가 생겼어요",
  },
  // 서버가 돌려주는 오류 코드(대문자 상수)를 사람이 읽는 문장으로 바꾼다.
  // 조사가 없을 때(POLL_NOT_FOUND)는 위의 notFound 문구를 쓰므로 여기에 넣지 않는다.
  errors: {
    NOT_FOUND: "찾을 수 없는 주소예요.",
    ORGANIZER_KEY_INVALID: "주최자 키가 올바르지 않아요.",
    INVALID_REQUEST: "요청 형식이 올바르지 않아요.",
    INVALID_DATE: "날짜가 올바르지 않아요.",
    END_BEFORE_START: "종료일이 시작일보다 앞설 수 없어요.",
    PERIOD_TOO_LONG: "기간이 너무 길어요. 92일 이하로 정해 주세요.",
    TITLE_EMPTY: "제목을 입력해 주세요.",
    TITLE_TOO_LONG: "제목이 너무 길어요. 60자 이하로 써 주세요.",
    NETWORK: "연결에 문제가 있어요. 잠시 뒤 다시 시도해 주세요.",
    UNKNOWN: "알 수 없는 문제가 생겼어요. 잠시 뒤 다시 시도해 주세요.",
  },
};

export type Messages = typeof ko;
