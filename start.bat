@echo off
title Mayalu - AI Call Assistant
echo =============================================
echo     Mayalu - Starting Next.js App
echo =============================================
echo.

echo Starting Next.js dev server (port 3000)...
echo.
echo   Frontend:  http://localhost:3000
echo   Voice Chat: http://localhost:3000/voice
echo.
echo   For phone calling with Twilio:
echo   1. Run: npx ngrok http 3000
echo   2. Copy the ngrok URL
echo   3. Set Twilio webhook to: YOUR_NGROK_URL/api/twilio/incoming
echo.
echo =============================================
echo.

npx next dev
pause
