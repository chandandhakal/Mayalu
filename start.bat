@echo off
title Mayalu - AI Call Assistant
echo =============================================
echo     Mayalu - Starting All Services
echo =============================================
echo.

set BASE=%~dp0

echo [1/3] Starting Backend API (port 3001)...
start "Mayalu-Backend" cmd /c "cd /d "%BASE%backend" && node server.js"
timeout /t 3 /nobreak >nul

echo [2/3] Starting Frontend (port 5173)...
start "Mayalu-Frontend" cmd /c "cd /d "%BASE%frontend" && node node_modules\vite\bin\vite.js --host"
timeout /t 3 /nobreak >nul

echo [3/3] Starting ngrok for phone calling (port 3001)...
start "Mayalu-ngrok" cmd /c "cd /d "%BASE%backend" && npx ngrok http 3001"
timeout /t 5 /nobreak >nul

echo.
echo =============================================
echo   Frontend:  http://localhost:5173
echo   Voice Chat: http://localhost:5173/voice.html  
echo   API:       http://localhost:3001
echo.
echo   Phone Calling:
echo   1. Check ngrok window for your public URL
echo   2. Go to https://console.twilio.com
echo   3. Buy a phone number (~$1/month)
echo   4. Set Voice Webhook to: YOUR_NGROK_URL/api/twilio/incoming
echo   5. Forward calls from 9745445935 to Twilio number
echo.
echo   Or for free testing:
echo   - Use voice.html for browser-based voice chat
echo   - Use ai-test.html for text-only chat
echo =============================================
echo.
pause
