@echo off
echo Starting NoType.ai...
cd /d "%~dp0"

rem Check for debug mode
if "%1"=="--debug" (
  echo Debug mode enabled. Starting with DevTools...
  set DEBUG_ARG=--debug
) else (
  set DEBUG_ARG=
)

rem Check if node_modules exists and express is installed
if not exist "node_modules\express" (
    echo Express module not found. Installing dependencies...
    call npm install express axios electron-store
    echo Dependencies installed.
)

if exist "node_modules\electron\dist\electron.exe" (
    start "" "node_modules\electron\dist\electron.exe" . %DEBUG_ARG%
) else (
    echo Error: Electron executable not found.
    echo Make sure you extract all files and maintain the folder structure.
    echo Running npm install to fix dependencies...
    call npm install
    
    if exist "node_modules\electron\dist\electron.exe" (
        start "" "node_modules\electron\dist\electron.exe" . %DEBUG_ARG%
    ) else (
        echo Installation failed. Please run install-dependencies.bat manually.
        pause
    )
)
exit 