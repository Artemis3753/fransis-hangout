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
  // 링크를 카카오톡에 붙였을 때 미리보기 카드에 뜨는 설명. 서버가 HTML에 직접 넣는다(수집기는 스크립트를 실행하지 않는다).
  share: {
    description: "함께 갈 수 있는 날짜를 골라 주세요. 로그인 없이 이름만 적으면 돼요.",
    linkHeading: "이 조사 링크",
    linkNote: "단톡방에 붙여 넣어 친구들에게 보내세요.",
    // 수정 링크와 조사 링크의 복사 버튼이 함께 쓴다.
    copy: "링크 복사",
    copied: "복사했어요.",
    // 일부 앱 안 브라우저는 복사를 막는다. 링크가 입력칸에 보이므로 직접 복사하는 길을 알려 준다.
    copyFailed: "자동으로 복사하지 못했어요. 위 링크를 길게 눌러 복사해 주세요.",
  },
  confirmed: {
    heading: "확정된 날짜",
  },
  organizer: {
    heading: "주최자 메뉴",
    keyLabel: "주최자 키",
    keyNote: "키는 이 화면에만 잠깐 기억되고, 새로고침하면 사라져요.",
    respondentsHeading: "응답 현황",
    noRespondents: "아직 참여한 사람이 없어요.",
    answered: "응답함",
    notAnswered: "아직 응답 안 함",
    remove: "삭제",
    // 지우면 그 사람의 응답이 모두 사라지니, 실수로 누르지 않게 한 번 더 누르게 한다.
    removeConfirm: "한 번 더 누르면 삭제돼요",
    removed: "{name}님을 삭제했어요.",
    closeHeading: "마감",
    closeNote: "마감하면 참여와 응답 수정이 멈추고 결과만 볼 수 있어요. 확정 날짜는 시작일과 종료일을 함께 정하거나, 둘 다 비워 두세요.",
    confirmedStartLabel: "확정 시작일 (선택)",
    confirmedEndLabel: "확정 종료일 (선택)",
    rangeBothNeeded: "확정 날짜는 시작일과 종료일을 함께 정해 주세요.",
    close: "마감하기",
    updateRange: "확정 날짜 바꾸기",
    reopen: "다시 열기",
    working: "처리하는 중…",
    closedDone: "마감했어요.",
    reopenedDone: "다시 열었어요. 확정 날짜는 지워졌어요.",
  },
  editLink: {
    // 주최자가 나를 지워서 이 기기에 남은 기록이 쓸모없어진 경우
    removed: "이 조사에서 참여 기록이 삭제됐어요. 이름으로 다시 참여할 수 있어요.",
    heading: "내 수정 링크",
    // 링크를 가진 사람은 누구나 내 응답을 고칠 수 있으니, 보관 방법과 함께 주의를 적는다.
    body: "다른 기기나 브라우저에서 내 응답을 고치려면 이 링크로 열어 주세요. 이 링크를 가진 사람은 내 응답을 고칠 수 있으니 나만 보관해 주세요.",
    // 링크로 열었는데 잘렸거나 바뀌어서 서버가 거절한 경우
    invalid: "수정 링크가 올바르지 않아요. 링크를 끝까지 복사했는지 확인해 주세요.",
    // 이 브라우저에서 참여한 기록을 찾지 못한 사람에게. 새로 온 사람과 다른 기기로 온 사람 모두에게 맞는 문장이다.
    unrecognized: "이 브라우저에서는 참여한 기록을 찾지 못했어요. 처음이라면 이름으로 참여해 주세요. 이미 참여했다면 저장해 둔 수정 링크로 다시 열어 주세요.",
    unrecognizedClosed: "이 브라우저에서는 참여한 기록을 찾지 못했어요. 이미 참여했다면 저장해 둔 수정 링크로 다시 열어 주세요.",
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
    CONFIRMED_OUT_OF_RANGE: "확정 날짜가 후보 기간 밖에 있어요.",
    RESPONDENT_NOT_FOUND: "이미 삭제됐거나 없는 응답자예요.",
    // 참여할 때와 응답을 저장할 때 모두 이 코드가 오므로, 어느 쪽에도 맞는 문장으로 쓴다.
    POLL_CLOSED: "마감된 조사라 더 이상 바꿀 수 없어요.",
    TITLE_EMPTY: "제목을 입력해 주세요.",
    TITLE_TOO_LONG: "제목이 너무 길어요. 60자 이하로 써 주세요.",
    NETWORK: "연결에 문제가 있어요. 잠시 뒤 다시 시도해 주세요.",
    UNKNOWN: "알 수 없는 문제가 생겼어요. 잠시 뒤 다시 시도해 주세요.",
  },
};

export type Messages = typeof ko;
