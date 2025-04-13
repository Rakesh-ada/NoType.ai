@echo off
echo Checking if Node.js and npm are installed...

where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: npm is not installed.
    echo Please install Node.js from https://nodejs.org/
    echo After installation, run install-dependencies.bat
    echo.
    pause
    exit /b 1
) else (
    echo Found npm installation.
    npm -v
    echo.
    echo You can now run install-dependencies.bat
    echo.
    pause
    exit /b 0
) 