@echo off
echo Installing dependencies for NoType.ai...
cd /d "%~dp0"

REM Check if Node.js and npm are installed
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: npm is not installed.
    echo Please install Node.js from https://nodejs.org/
    echo After installation, run this script again.
    echo.
    pause
    exit /b 1
)

echo Node.js found. Installing npm packages...
call npm install express axios electron-store

REM Check if electron is installed
if not exist "node_modules\electron" (
    echo Installing Electron...
    call npm install electron
)

echo.
echo Dependencies installed successfully!
echo You can now run the application by double-clicking launch-notype.bat
echo.
pause 