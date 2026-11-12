#!/bin/bash
# 위험한 git 명령을 실행 전에 막는 PreToolUse hook.
# 원본: mattpocock/skills (4ae2317). 로컬 변경(2026-11-03): 일반 `git push`는 허용하고
# 강제 푸시(--force, -f)만 막는다. 푸시는 사용자가 요청하면 에이전트가 해야 하기 때문.

# jq가 없으면 명령을 읽지 못해 아무것도 막지 못한다. 조용히 통과시키지 않고 소리 내어 실패한다.
command -v jq >/dev/null || { echo "BLOCKED: jq is not installed, so the git guardrail cannot run." >&2; exit 2; }

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command')

DANGEROUS_PATTERNS=(
  "git push.*( --force| -f( |$))"
  "git reset --hard"
  "git clean -f"
  "git branch -D"
  "git checkout \."
  "git restore \."
)

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qE "$pattern"; then
    echo "BLOCKED: '$COMMAND' matches dangerous pattern '$pattern'. The user has prevented you from doing this." >&2
    exit 2
  fi
done

exit 0
