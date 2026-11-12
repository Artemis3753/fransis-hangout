// "이 기기에서 이미 참여했다"는 사실을 기억해서, 다시 열었을 때 이름을 또 묻지 않게 한다.
// 수정 토큰도 여기 같이 저장한다. 나중에 내 응답을 고칠 때 본인임을 증명하는 데 쓴다.
export type StoredRespondent = { id: string; name: string; editToken: string };

const keyFor = (pollId: string) => `fransis:poll:${pollId}:respondent`;

// 사생활 보호 모드나 저장소 차단 환경에서는 localStorage 접근 자체가 예외를 던질 수 있다.
// 저장이 안 돼도 화면은 정상 동작해야 하므로 모든 접근을 try/catch로 감싼다.
export function loadRespondent(pollId: string): StoredRespondent | null {
  try {
    const raw = localStorage.getItem(keyFor(pollId));
    if (raw === null) return null;
    const value = JSON.parse(raw);
    // 저장된 값이 손상됐을 때(직접 고쳤거나 옛 형식) 화면이 깨지지 않도록 모양을 확인한다.
    if (typeof value?.id === "string" && typeof value?.name === "string" && typeof value?.editToken === "string") {
      return value as StoredRespondent;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveRespondent(pollId: string, respondent: StoredRespondent): void {
  try {
    localStorage.setItem(keyFor(pollId), JSON.stringify(respondent));
  } catch {
    // 저장 실패는 조용히 넘긴다. 참여 자체는 이미 서버에 기록됐다.
  }
}
