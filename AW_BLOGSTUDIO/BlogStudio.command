#!/bin/bash
# 더블클릭하면 열려요. (macOS)
cd "$(dirname "${BASH_SOURCE[0]}")"

if ! command -v node >/dev/null 2>&1; then
  echo; echo "  Node.js가 없어요."
  echo "  https://nodejs.org 에서 LTS 버전을 받아 설치하신 다음 다시 눌러주세요."
  echo; read -n 1 -s -r -p "  아무 키나 누르면 닫혀요"; exit 1
fi

# 작업 이력을 담는 곳(node:sqlite)이 Node 22.5 부터 들어 있다.
# 그 아래 판에서는 프로그램이 켜지다 멈추므로 여기서 미리 알려드린다.
V=$(node -p "process.versions.node.split('.')[0]")
if [ "$V" -lt 22 ]; then
  echo; echo "  Node.js가 너무 오래됐어요 (지금 $(node -v), 22 이상이 필요해요)."
  echo "  https://nodejs.org 에서 LTS 버전으로 다시 설치해주세요."
  echo; read -n 1 -s -r -p "  아무 키나 누르면 닫혀요"; exit 1
fi

if ! command -v claude >/dev/null 2>&1; then
  echo; echo "  Claude Code가 아직 없어요. 화면은 열리지만 글쓰기는 안 돼요."
  echo "  설치: npm install -g @anthropic-ai/claude-code"; echo
fi

node --no-warnings "bin/lib/ui.mjs" "."
