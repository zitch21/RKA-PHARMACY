@echo off
title R.K.A Pharmacy IMS Launcher
echo =======================================================
echo  Starting R.K.A Pharmacy Inventory System...
echo  San Antonio, Agoo, La Union
echo =======================================================
echo.

cd /d "%~dp0"
start /B runtime\node.exe server\index.js
timeout /t 2 /nobreak >nul
start msedge.exe --app=http://localhost:5000 2>nul || start http://localhost:5000

echo Application is running at http://localhost:5000
echo Minimize this window while working. Press Ctrl+C or close to exit.
pause >nul
