@echo off
echo NoType.ai Troubleshooter
echo =====================
echo.

cd /d "%~dp0"

echo 1. Checking for Node.js installation...
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    goto :end
) else (
    echo [OK] Node.js found: 
    node -v
)

echo.
echo 2. Checking for required files...
set MISSING_FILES=0
for %%F in (index.html main.js renderer.js api_service.js preload.js mcp_server.js mcp_client.js mcp_ui.js settings-fix.js) do (
    if not exist "%%F" (
        echo [ERROR] Missing file: %%F
        set /a MISSING_FILES+=1
    ) else (
        echo [OK] Found file: %%F
    )
)

if %MISSING_FILES% gtr 0 (
    echo.
    echo [WARNING] Some files are missing. Try re-extracting the ZIP file.
) else (
    echo.
    echo [OK] All required files are present.
)

echo.
echo 3. Checking for required npm packages...
for %%P in (express axios electron electron-store) do (
    if not exist "node_modules\%%P" (
        echo [ERROR] Missing package: %%P. Will install.
        set NEED_INSTALL=1
    ) else (
        echo [OK] Found package: %%P
    )
)

if defined NEED_INSTALL (
    echo.
    echo Installing missing npm packages...
    call npm install express axios electron-store
    echo.
    echo 3b. Re-checking for required npm packages...
    for %%P in (express axios electron electron-store) do (
        if not exist "node_modules\%%P" (
            echo [ERROR] Still missing package: %%P
        ) else (
            echo [OK] Found package: %%P
        )
    )
)

echo.
echo 4. Would you like to start NoType.ai in debug mode? (y/n)
set /p DEBUG_CHOICE="Enter your choice: "
if /i "%DEBUG_CHOICE%"=="y" (
    echo Starting NoType.ai in debug mode...
    echo This will open DevTools to help identify issues.
    call launch-notype.bat --debug
) else (
    echo Starting NoType.ai normally...
    call launch-notype.bat
)

:end
echo.
echo Troubleshooting completed.
pause 