@echo off
echo ========================================
echo Restarting IoT Backend Server
echo ========================================
echo.

REM Kill any existing node processes for this project
echo [1/3] Stopping existing backend...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq *backend*" 2>nul

echo.
echo [2/3] Waiting 2 seconds...
timeout /t 2 /nobreak >nul

echo.
echo [3/3] Starting backend server...
echo.
npm start

pause
