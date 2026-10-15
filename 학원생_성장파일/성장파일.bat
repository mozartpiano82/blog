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

node --no-warnings "bin\growth.mjs"
pause
