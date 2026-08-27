@echo off
chcp 65001 >nul
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js가 없어요.
  echo   https://nodejs.org 에서 LTS 버전을 받아 설치하신 다음 다시 눌러주세요.
  echo.
  pause
  exit /b 1
)

rem 판이 낮으면 켜지다 멈춘다. 원장님껜 그냥 고장이라 여기서 미리 알려드린다.
rem 맥 런처에는 이 검사가 있었는데 윈도우에는 없었다.
for /f "delims=" %%v in ('node -p "process.versions.node.split('.')[0]"') do set NODEMAJOR=%%v
if not defined NODEMAJOR (
  echo.
  echo   Node.js 버전을 못 읽었어요. 다시 설치해주시겠어요?
  echo   https://nodejs.org 에서 LTS 버전을 받으시면 돼요.
  echo.
  pause
  exit /b 1
)
if %NODEMAJOR% LSS 22 (
  echo.
  echo   Node.js가 너무 오래됐어요 ^(22 이상이 필요해요^).
  echo   https://nodejs.org 에서 LTS 버전으로 다시 설치해주세요.
  echo.
  pause
  exit /b 1
)

where claude >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Claude Code가 아직 없어요. 화면은 열리지만 글쓰기는 안 돼요.
  echo   설치: npm install -g @anthropic-ai/claude-code
  echo.
)

node --no-warnings "bin\lib\ui.mjs" "."
pause
