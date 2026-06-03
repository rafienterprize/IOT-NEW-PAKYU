@echo off
echo ========================================
echo Test ESP32-4 Setelah Upload
echo ========================================
echo.
echo Pastikan ESP32-4 sudah di-upload dan RESET!
echo.
pause

cd backend

echo [1/2] Kill process node lama...
taskkill /F /IM node.exe 2>nul

echo.
echo [2/2] Test serial COM8...
echo.
node quick-test-serial.js

echo.
echo ========================================
echo Selesai!
echo ========================================
pause
