#!/bin/bash
# 더블클릭하면 열려요. (macOS)
cd "$(dirname "${BASH_SOURCE[0]}")"

if ! command -v node >/dev/null 2>&1; then
  echo; echo "  Node.js가 없어요."
  echo "  https://nodejs.org 에서 LTS 버전을 받아 설치하신 다음 다시 눌러주세요."
  echo; read -n 1 -s -r -p "  아무 키나 누르면 닫혀요"; exit 1
fi

node --no-warnings "bin/growth.mjs"
