
@echo off
title GEHU ESMS Launcher

cd /d "%~dp0"

echo Starting GEHU Examination Management System...

start "" cmd /c "timeout /t 4 /nobreak >nul & start http://localhost:3000"

call npm.cmd run dev

pause
