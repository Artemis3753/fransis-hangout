import { closePoll, fetchResults, removeRespondent, reopenPoll, type Poll, type Result } from "./api";
import { node } from "./calendar";
import { errorMessage, format, messages as m } from "./i18n";

// 주최자 메뉴는 주소가 #organizer일 때만 보인다. 키 입력칸은 그 안에 있다.
// 이 주소를 아는 것이 권한은 아니다. 진짜 보호는 서버가 모든 주최자 요청에서 키를 확인하는 것이고,
// 여기서는 일반 친구 화면에 주최자 버튼이 보이지 않게만 한다.
export const isOrganizerView = () => location.hash === "#organizer";

// 키는 이 모듈의 변수에만 둔다. localStorage나 주소에 남기면 공유 기기와 방문 기록에 비밀이 남는다.
// 대신 새로고침하면 다시 입력해야 한다.
let organizerKey = "";

// 동작이 성공하면 화면 전체를 다시 그려서 패널도 새로 만들어진다. 그 뒤에도 "마감했어요" 같은 안내가
// 남도록 한 번만 보여 주는 문구를 여기에 둔다.
let flash = "";

/** 마감·확정 날짜·다시 열기·응답자 삭제. 동작이 성공하면 onChanged로 화면 전체를 다시 불러온다. */
export function buildOrganizerPanel(poll: Poll, onChanged: () => void): HTMLElement {
  const root = node("section", "organizer");
  root.append(node("h2", "", m.organizer.heading));

  const status = node("p", "status");
  status.setAttribute("role", "status");
  const showStatus = (text: string, isError = false) => {
    status.className = isError ? "status error" : "status ok";
    status.textContent = text;
  };
  if (flash) {
    showStatus(flash);
    flash = "";
  }

  // --- 키
  const keyLabel = node("label", "", m.organizer.keyLabel);
  keyLabel.htmlFor = "organizer-key";
  const keyInput = node("input", "organizer-key");
  keyInput.id = "organizer-key";
  keyInput.type = "password";
  keyInput.autocomplete = "off";
  keyInput.value = organizerKey;
  keyInput.addEventListener("input", () => {
    organizerKey = keyInput.value;
  });
  root.append(keyLabel, keyInput, node("p", "muted small", m.organizer.keyNote));

  // 동작 하나가 끝날 때까지 모든 버튼을 잠가서, 마감과 삭제가 겹쳐 나가지 않게 한다.
  const buttons: HTMLButtonElement[] = [];
  const lockButtons = (locked: boolean) => buttons.forEach((b) => (b.disabled = locked));
  const actionButton = (label: string) => {
    const button = node("button", "organizer-button", label);
    button.type = "button";
    buttons.push(button);
    return button;
  };

  async function run(action: () => Promise<Result<unknown>>, done: string) {
    lockButtons(true);
    showStatus(m.organizer.working);
    const result = await action();
    if (result.ok) {
      flash = done;
      onChanged();
      return;
    }
    showStatus(errorMessage(result.code), true);
    lockButtons(false);
  }

  // --- 응답 현황과 삭제
  root.append(node("h3", "", m.organizer.respondentsHeading));
  const list = node("ul", "organizer-list");
  root.append(list);
  void fetchResults(poll.id).then((loaded) => {
    if (!loaded.ok) {
      list.replaceChildren(node("li", "error", errorMessage(loaded.code)));
      return;
    }
    if (loaded.value.respondents.length === 0) {
      list.replaceChildren(node("li", "muted", m.organizer.noRespondents));
      return;
    }
    list.replaceChildren(
      ...loaded.value.respondents.map((respondent) => {
        const item = node("li", "organizer-item");
        const remove = actionButton(m.organizer.remove);
        let armed = false;
        remove.addEventListener("click", () => {
          if (!armed) {
            armed = true;
            remove.textContent = m.organizer.removeConfirm;
            return;
          }
          void run(() => removeRespondent(poll.id, respondent.id, organizerKey), format(m.organizer.removed, { name: respondent.name }));
        });
        // 다른 곳을 누르면 "한 번 더" 상태를 풀어서, 시간이 지난 뒤 우연히 눌러 지워지는 일이 없게 한다.
        remove.addEventListener("blur", () => {
          armed = false;
          remove.textContent = m.organizer.remove;
        });
        item.append(
          node("span", "organizer-name", respondent.name),
          node("span", "muted small", respondent.answered ? m.organizer.answered : m.organizer.notAnswered),
          remove,
        );
        return item;
      }),
    );
  });

  // --- 마감과 확정 날짜
  root.append(node("h3", "", m.organizer.closeHeading), node("p", "muted small", m.organizer.closeNote));
  const dateInput = (id: string, label: string, value: string | null) => {
    const wrap = node("div", "organizer-date");
    const labelNode = node("label", "", label);
    labelNode.htmlFor = id;
    const input = node("input", "");
    input.id = id;
    input.type = "date";
    // 후보 기간 밖의 날짜는 고르지 못하게 해서 서버에서 거절당하는 일을 줄인다. 최종 검사는 서버가 한다.
    input.min = poll.startDate;
    input.max = poll.endDate;
    input.value = value ?? "";
    wrap.append(labelNode, input);
    return { wrap, input };
  };
  const start = dateInput("confirmed-start", m.organizer.confirmedStartLabel, poll.confirmedStartDate);
  const end = dateInput("confirmed-end", m.organizer.confirmedEndLabel, poll.confirmedEndDate);
  root.append(start.wrap, end.wrap);

  const closed = poll.status === "closed";
  const closeButton = actionButton(closed ? m.organizer.updateRange : m.organizer.close);
  closeButton.addEventListener("click", () => {
    const hasStart = start.input.value !== "";
    const hasEnd = end.input.value !== "";
    if (hasStart !== hasEnd) {
      showStatus(m.organizer.rangeBothNeeded, true);
      return;
    }
    const range = hasStart ? { confirmedStartDate: start.input.value, confirmedEndDate: end.input.value } : null;
    void run(() => closePoll(poll.id, organizerKey, range), m.organizer.closedDone);
  });
  root.append(closeButton);

  if (closed) {
    const reopen = actionButton(m.organizer.reopen);
    reopen.addEventListener("click", () => void run(() => reopenPoll(poll.id, organizerKey), m.organizer.reopenedDone));
    root.append(reopen);
  }

  root.append(status);
  return root;
}
