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
  calendar: {
    weekdays: ["일", "월", "화", "수", "목", "금", "토"],
    month: "{year}년 {month}월",
    hint: "날짜를 누를 때마다 선호 → 가능 → 불가능 → 응답 없음 순서로 바뀌어요.",
  },
  availability: {
    preferred: "선호",
    available: "가능",
    unavailable: "불가능",
    none: "응답 없음",
  },
  day: {
    // 스크린리더가 읽는 날짜 칸의 이름. 기호(★ ○ ✕)만으로는 뜻이 전달되지 않아서 문장으로 풀어 둔다.
    label: "{month}월 {day}일 {weekday}요일, {state}",
  },
  answers: {
    loading: "내 응답을 불러오는 중…",
    save: "저장하기",
    saving: "저장하는 중…",
    saved: "저장했어요.",
    closedNote: "마감된 조사라 응답을 고칠 수 없어요.",
  },
  results: {
    heading: "결과",
    loading: "결과를 불러오는 중…",
    progress: "{total}명 중 {answered}명 응답",
    noRespondents: "아직 참여한 사람이 없어요.",
    noAnswers: "아직 응답한 사람이 없어요.",
    bestHeading: "추천 날짜",
    bestHint: "안 되는 사람이 적은 날부터, 그다음 선호가 많은 날 순서예요.",
    unanimous: "모두 가능",
    // 달력 칸의 ○ 뒤 숫자는 선호를 포함한 "올 수 있는 사람" 수다.
    gridLegend: "○ 올 수 있는 사람(선호 포함) · ✕ 못 오는 사람 · 굵은 테두리는 응답한 사람이 모두 가능한 날",
    gridHint: "날짜를 누르면 누가 되는지 볼 수 있어요.",
    // 목록과 달력 칸이 같이 쓰는 한 줄 요약
    counts: "선호 {preferred} · 가능 {available} · 불가능 {unavailable}",
    // 스크린리더가 읽는 달력 칸의 이름. 숫자 기호만으로는 뜻이 전달되지 않아서 문장으로 풀어 둔다.
    cellLabel: "{month}월 {day}일 {weekday}요일, 선호 {preferred}명, 가능 {available}명, 불가능 {unavailable}명, 응답 없음 {unanswered}명",
    detailTitle: "{month}월 {day}일 {weekday}요일",
    unansweredCount: "응답 없음 {count}명",
    nobody: "없음",
    close: "닫기",
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
    EDIT_TOKEN_INVALID: "이 기기에서는 내 응답을 고칠 수 없어요.",
    DATE_OUT_OF_RANGE: "후보 기간 밖의 날짜가 있어요.",
    INVALID_AVAILABILITY: "선택한 상태가 올바르지 않아요.",
    NAME_EMPTY: "이름을 입력해 주세요.",
    NAME_TOO_LONG: "이름이 너무 길어요. 20자 이하로 써 주세요.",
    NAME_TAKEN: "같은 이름으로 이미 참여한 사람이 있어요. 다른 이름을 써 주세요.",
    POLL_FULL: "참여 인원이 가득 찼어요.",
    // 참여할 때와 응답을 저장할 때 모두 이 코드가 오므로, 어느 쪽에도 맞는 문장으로 쓴다.
    POLL_CLOSED: "마감된 조사라 더 이상 바꿀 수 없어요.",
    TITLE_EMPTY: "제목을 입력해 주세요.",
    TITLE_TOO_LONG: "제목이 너무 길어요. 60자 이하로 써 주세요.",
    NETWORK: "연결에 문제가 있어요. 잠시 뒤 다시 시도해 주세요.",
    UNKNOWN: "알 수 없는 문제가 생겼어요. 잠시 뒤 다시 시도해 주세요.",
  },
};

export type Messages = typeof ko;
