@echo off
title R.K.A Pharmacy IMS - Setup Desktop Shortcut
echo ========================================================
echo   R.K.A PHARMACY INVENTORY MANAGEMENT SYSTEM (FEFO+)
echo   Desktop Shortcut Installer
echo ========================================================
echo.

set "TARGET_EXE=%~dp0RKA-Pharmacy-IMS.exe"
set "WORKING_DIR=%~dp0"
set "ICON_FILE=%~dp0app-icon.ico"

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $desktop = $ws.SpecialFolders.Item('Desktop'); if (-not $desktop -or -not (Test-Path $desktop)) { $desktop = [Environment]::GetFolderPath([Environment+SpecialFolder]::Desktop) }; if (-not (Test-Path $desktop)) { Write-Error ('Desktop folder not found: ' + $desktop); exit 1 }; $shortcut = Join-Path $desktop 'R.K.A Pharmacy IMS.lnk'; $s = $ws.CreateShortcut($shortcut); $s.TargetPath = '%TARGET_EXE%'; $s.WorkingDirectory = '%WORKING_DIR%'; if (Test-Path '%ICON_FILE%') { $s.IconLocation = '%ICON_FILE%,0' }; $s.Description = 'R.K.A Pharmacy Inventory System'; $s.Save(); Write-Host '[SUCCESS] Desktop shortcut created successfully on your Desktop!'; Write-Host ('File: ' + $shortcut);"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo You can now launch R.K.A Pharmacy IMS directly by double-clicking the shortcut on your desktop.
) else (
    echo.
    echo [ERROR] Failed to create desktop shortcut.
)

echo.
pause
