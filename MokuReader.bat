@echo off
title Development Environment
setlocal EnableDelayedExpansion
set RETRY_COUNT=0
set MAX_RETRIES=50

echo Starting Next.js server...
start "NextJS Server" cmd /k "npm run start"

echo Waiting for server to start...
timeout /t 10

:tunnel_loop
set /a RETRY_COUNT+=1
if !RETRY_COUNT! gtr !MAX_RETRIES! (
    echo Max retries reached. Exiting...
    goto cleanup
)

echo Starting localtunnel (attempt !RETRY_COUNT!/!MAX_RETRIES!)...
lt --port 3000 --subdomain mokurodex

echo Tunnel disconnected, waiting before restart...
timeout /t 5
goto tunnel_loop

:cleanup
echo Cleaning up...
taskkill /f /im node.exe 2>nul
exit /b