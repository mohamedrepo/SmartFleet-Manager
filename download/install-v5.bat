@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
title SmartFleet Manager v5.1 - Download and Install

echo ============================================
echo   SmartFleet Manager v5.1 - Installer
echo ============================================
echo.

set "APP_DIR=C:\SmartFleet-Manager-v5"
set "PART1=https://files.catbox.moe/2i9zt8.part-aa"
set "PART2=https://files.catbox.moe/5gwyuh.part-ab"
set "PART3=https://files.catbox.moe/q9tmcm.part-ac"
set "ZIP=SmartFleet-Manager-v5.zip"

echo [1/4] Closing any running SmartFleet instances...
taskkill /F /IM "SmartFleet Manager.exe" >nul 2>&1
taskkill /F /IM electron.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/4] Downloading package parts...
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%PART1%' -OutFile '%ZIP%.part-aa' -UseBasicParsing"
if errorlevel 1 (
    echo ERROR: Failed to download part 1
    pause
    exit /b 1
)
echo   Part 1 downloaded

powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%PART2%' -OutFile '%ZIP%.part-ab' -UseBasicParsing"
if errorlevel 1 (
    echo ERROR: Failed to download part 2
    pause
    exit /b 1
)
echo   Part 2 downloaded

powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%PART3%' -OutFile '%ZIP%.part-ac' -UseBasicParsing"
if errorlevel 1 (
    echo ERROR: Failed to download part 3
    pause
    exit /b 1
)
echo   Part 3 downloaded

echo [3/4] Combining parts...
copy /B "%ZIP%.part-aa" + "%ZIP%.part-ab" + "%ZIP%.part-ac" "%ZIP%" >nul
if errorlevel 1 (
    echo ERROR: Failed to combine parts
    pause
    exit /b 1
)
echo   Combined successfully

echo [4/4] Extracting to %APP_DIR%...
if exist "%APP_DIR%" (
    echo   Removing old version...
    rmdir /S /Q "%APP_DIR%" >nul 2>&1
    timeout /t 2 /nobreak >nul
)

powershell -Command "Expand-Archive -Path '%ZIP%' -DestinationPath '%APP_DIR%' -Force"
if errorlevel 1 (
    echo ERROR: Failed to extract
    pause
    exit /b 1
)

echo.
echo Cleaning up download files...
del /Q "%ZIP%.part-aa" >nul 2>&1
del /Q "%ZIP%.part-ab" >nul 2>&1
del /Q "%ZIP%.part-ac" >nul 2>&1
del /Q "%ZIP%" >nul 2>&1

echo.
echo ============================================
echo   Installation complete!
echo ============================================
echo.
echo   Location: %APP_DIR%
echo.
echo   Starting SmartFleet Manager...
echo.

cd /D "%APP_DIR%"
start "" "SmartFleet Manager.exe"

timeout /t 3 /nobreak >nul
exit