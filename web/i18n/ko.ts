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
    closed: "마감된 조사예요. 더 이상 참여할 수 없어요.",
  },
  join: {
    nameLabel: "이름",
    namePlaceholder: "친구들이 알아볼 수 있는 이름",
    submit: "참여하기",
    submitting: "참여하는 중…",
    // 이미 참여한 기기에서 다시 열었을 때 보여 주는 인사
    joined: "{name}님, 참여했어요.",
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
  // 페이지를 처음 열 때 조사가 없으면 위의 notFound 화면을 쓰고, 참여를 시도하는 중에
  // 조사가 사라진 경우에는 아래 문구를 폼 오류로 보여 준다.
  errors: {
    POLL_NOT_FOUND: "조사를 찾을 수 없어요.",
    NOT_FOUND: "찾을 수 없는 주소예요.",
    ORGANIZER_KEY_INVALID: "주최자 키가 올바르지 않아요.",
    INVALID_REQUEST: "요청 형식이 올바르지 않아요.",
    INVALID_DATE: "날짜가 올바르지 않아요.",
    END_BEFORE_START: "종료일이 시작일보다 앞설 수 없어요.",
    PERIOD_TOO_LONG: "기간이 너무 길어요. 92일 이하로 정해 주세요.",
    NAME_EMPTY: "이름을 입력해 주세요.",
    NAME_TOO_LONG: "이름이 너무 길어요. 20자 이하로 써 주세요.",
    NAME_TAKEN: "같은 이름으로 이미 참여한 사람이 있어요. 다른 이름을 써 주세요.",
    POLL_FULL: "참여 인원이 가득 찼어요.",
    POLL_CLOSED: "마감된 조사라 더 이상 참여할 수 없어요.",
    TITLE_EMPTY: "제목을 입력해 주세요.",
    TITLE_TOO_LONG: "제목이 너무 길어요. 60자 이하로 써 주세요.",
    NETWORK: "연결에 문제가 있어요. 잠시 뒤 다시 시도해 주세요.",
    UNKNOWN: "알 수 없는 문제가 생겼어요. 잠시 뒤 다시 시도해 주세요.",
  },
};

export type Messages = typeof ko;
