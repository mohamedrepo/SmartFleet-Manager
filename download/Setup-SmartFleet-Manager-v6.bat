@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
title SmartFleet Manager - Setup Wizard

:: ========================================
:: SmartFleet Manager v6.0
:: Professional Windows 11 x64 Installer
:: Install to: D:\SmartFleetManager
:: ========================================

color 0A
echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║                                                  ║
echo  ║          SmartFleet Manager v6.0                 ║
echo  ║          Desktop Fleet Management System          ║
echo  ║                                                  ║
echo  ║          Windows 11 x64 Installer                ║
echo  ║                                                  ║
echo  ╚══════════════════════════════════════════════════╝
echo.

:: ===== CHECK ADMIN =====
net session >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  [ERROR] This installer requires Administrator privileges.
    echo.
    echo  Please right-click this file and select:
    echo  "Run as administrator"
    echo.
    pause
    exit /b 1
)

:: ===== CONFIGURATION =====
set "INSTALL_DIR=D:\SmartFleetManager"
set "APP_DATA_DIR=%LOCALAPPDATA%\SmartFleet Manager"
set "APP_ROAMING=%APPDATA%\SmartFleet Manager"
set "SHORTCUT_NAME=SmartFleet Manager"
set "PART1_URL=https://files.catbox.moe/2i9zt8.part-aa"
set "PART2_URL=https://files.catbox.moe/5gwyuh.part-ab"
set "PART3_URL=https://files.catbox.moe/q9tmcm.part-ac"
set "ZIP_NAME=SmartFleet-v6.zip"
set "PARTS_DIR=%TEMP%\SmartFleetInstall"

echo  Install Directory: %INSTALL_DIR%
echo  App Data:          %APP_DATA_DIR%
echo  Database:          %APP_ROAMING%\db\custom.db
echo.
echo  Press any key to start installation...
pause >nul
cls

:: ===== STEP 1: PRE-CHECKS =====
echo.
echo  [1/8] System Requirements Check...
echo.

:: Check Windows version
ver | findstr /i "10.0.2" >nul 2>&1
if %errorlevel% equ 0 (
    echo  [OK] Windows 10/11 detected
) else (
    echo  [WARN] This is designed for Windows 11 x64
)

:: Check architecture
if "%PROCESSOR_ARCHITECTURE%"=="AMD64" (
    echo  [OK] x64 architecture detected
) else (
    echo  [WARN] Architecture: %PROCESSOR_ARCHITECTURE%
)

:: Check disk space on D: drive
for /f "tokens=3" %%a in ('dir D:\ /s 2^>nul ^| find "bytes free"') do set "FREE_SPACE=%%a"
if defined FREE_SPACE (
    echo  [OK] D: drive available
) else (
    echo  [WARN] Cannot verify D: drive
    echo  [INFO] Make sure D: drive exists and has 1GB+ free space
    echo.
    choice /C YN /M "Continue anyway"
    if errorlevel 2 exit /b 1
)

echo.

:: ===== STEP 2: CLOSE RUNNING INSTANCES =====
echo  [2/8] Closing running instances...
taskkill /F /IM "SmartFleet Manager.exe" >nul 2>&1
taskkill /F /IM "electron.exe" >nul 2>&1
timeout /t 2 /nobreak >nul
echo  [OK] Done
echo.

:: ===== STEP 3: CREATE DIRECTORY STRUCTURE =====
echo  [3/8] Creating directory structure...

:: Main install directory
if not exist "D:\" (
    echo  [ERROR] D: drive not found!
    echo  Please make sure D: drive exists.
    pause
    exit /b 1
)

:: Remove old installation if exists
if exist "%INSTALL_DIR%" (
    echo  [INFO] Removing previous installation...
    rmdir /S /Q "%INSTALL_DIR%" >nul 2>&1
    timeout /t 1 /nobreak >nul
)

:: Create directories
mkdir "%INSTALL_DIR%" 2>nul
if errorlevel 1 (
    echo  [ERROR] Cannot create %INSTALL_DIR%
    echo  Check drive permissions and available space.
    pause
    exit /b 1
)

mkdir "%INSTALL_DIR%\resources" 2>nul
mkdir "%INSTALL_DIR%\resources\app" 2>nul
mkdir "%INSTALL_DIR%\resources\db" 2>nul
mkdir "%INSTALL_DIR%\tmp" 2>nul
mkdir "%INSTALL_DIR%\logs" 2>nul

:: Create AppData directories (for database)
mkdir "%APP_ROAMING%" 2>nul
mkdir "%APP_ROAMING%\db" 2>nul
mkdir "%APP_ROAMING%\logs" 2>nul
mkdir "%APP_DATA_DIR%" 2>nul

echo  [OK] Directories created
echo.

:: ===== STEP 4: SET PERMISSIONS =====
echo  [4/8] Setting permissions...
icacls "%INSTALL_DIR%" /grant Users:M /T >nul 2>&1
icacls "%INSTALL_DIR%\resources\db" /grant Users:(OI)(CI)M >nul 2>&1
icacls "%INSTALL_DIR%\tmp" /grant Users:(OI)(CI)M >nul 2>&1
icacls "%APP_ROAMING%" /grant Users:(OI)(CI)M /T >nul 2>&1
echo  [OK] Permissions set
echo.

:: ===== STEP 5: DOWNLOAD APPLICATION =====
echo  [5/8] Downloading application files...
echo  This may take a few minutes depending on your internet speed...
echo.

:: Create temp directory for downloads
if exist "%PARTS_DIR%" rmdir /S /Q "%PARTS_DIR%" >nul 2>&1
mkdir "%PARTS_DIR%"

:: Download part 1
echo  Downloading part 1 of 3...
powershell -Command ^
    "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; " ^
    "$ProgressPreference = 'SilentlyContinue'; " ^
    "Invoke-WebRequest -Uri '%PART1_URL%' -OutFile '%PARTS_DIR%\part-aa' -UseBasicParsing"
if errorlevel 1 (
    echo  [ERROR] Failed to download part 1
    echo  Check your internet connection and try again.
    pause
    exit /b 1
)
echo  [OK] Part 1 downloaded

:: Download part 2
echo  Downloading part 2 of 3...
powershell -Command ^
    "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; " ^
    "$ProgressPreference = 'SilentlyContinue'; " ^
    "Invoke-WebRequest -Uri '%PART2_URL%' -OutFile '%PARTS_DIR%\part-ab' -UseBasicParsing"
if errorlevel 1 (
    echo  [ERROR] Failed to download part 2
    pause
    exit /b 1
)
echo  [OK] Part 2 downloaded

:: Download part 3
echo  Downloading part 3 of 3...
powershell -Command ^
    "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; " ^
    "$ProgressPreference = 'SilentlyContinue'; " ^
    "Invoke-WebRequest -Uri '%PART3_URL%' -OutFile '%PARTS_DIR%\part-ac' -UseBasicParsing"
if errorlevel 1 (
    echo  [ERROR] Failed to download part 3
    pause
    exit /b 1
)
echo  [OK] Part 3 downloaded
echo.

:: ===== STEP 6: EXTRACT =====
echo  [6/8] Extracting application files...

:: Combine parts
echo  Combining downloaded parts...
copy /B "%PARTS_DIR%\part-aa" + "%PARTS_DIR%\part-ab" + "%PARTS_DIR%\part-ac" "%PARTS_DIR%\%ZIP_NAME%" >nul
if errorlevel 1 (
    echo  [ERROR] Failed to combine parts
    pause
    exit /b 1
)
echo  [OK] Parts combined

:: Extract to install directory
echo  Extracting files (this may take a minute)...
powershell -Command "Expand-Archive -Path '%PARTS_DIR%\%ZIP_NAME%' -DestinationPath '%PARTS_DIR%\extracted' -Force"
if errorlevel 1 (
    echo  [ERROR] Failed to extract archive
    pause
    exit /b 1
)

:: Move extracted files to install directory
echo  Installing files to %INSTALL_DIR%...
xcopy "%PARTS_DIR%\extracted\SmartFleet-Manager-v6\*" "%INSTALL_DIR%\" /E /I /Q /Y >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Failed to install files
    pause
    exit /b 1
)
echo  [OK] Files installed
echo.

:: ===== STEP 7: CONFIGURE & SHORTCUTS =====
echo  [7/8] Configuring application...

:: Create package.json at root (Electron entry point)
echo {"name":"smartfleet-manager","version":"6.0.0","private":true,"main":"resources/app/electron/main.js"} > "%INSTALL_DIR%\package.json"

:: Create log files
echo SmartFleet Manager v6.0 - Install log > "%INSTALL_DIR%\logs\install.log"
echo Installed: %date% %time% >> "%INSTALL_DIR%\logs\install.log"
echo Install dir: %INSTALL_DIR% >> "%INSTALL_DIR%\logs\install.log"
echo Database: %APP_ROAMING%\db\custom.db >> "%INSTALL_DIR%\logs\install.log"

:: Create Desktop shortcut
powershell -Command ^
    "$ws = New-Object -ComObject WScript.Shell; " ^
    "$sc = $ws.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\SmartFleet Manager.lnk'); " ^
    "$sc.TargetPath = '%INSTALL_DIR%\SmartFleet Manager.exe'; " ^
    "$sc.WorkingDirectory = '%INSTALL_DIR%'; " ^
    "$sc.Description = 'SmartFleet Manager - Fleet Management System'; " ^
    "$sc.IconLocation = '%INSTALL_DIR%\resources\app\public\favicon.ico,0'; " ^
    "$sc.Save()"

:: Create Start Menu shortcut
powershell -Command ^
    "$ws = New-Object -ComObject WScript.Shell; " ^
    "$sc = $ws.CreateShortcut([Environment]::GetFolderPath('CommonStartMenu') + '\Programs\SmartFleet Manager.lnk'); " ^
    "$sc.TargetPath = '%INSTALL_DIR%\SmartFleet Manager.exe'; " ^
    "$sc.WorkingDirectory = '%INSTALL_DIR%'; " ^
    "$sc.Description = 'SmartFleet Manager - Fleet Management System'; " ^
    "$sc.IconLocation = '%INSTALL_DIR%\resources\app\public\favicon.ico,0'; " ^
    "$sc.Save()"

:: Create startup launcher script
(
echo @echo off
echo chcp 65001 ^>nul 2^>^&1
echo title SmartFleet Manager
echo cd /D "%INSTALL_DIR%"
echo start "" "SmartFleet Manager.exe"
echo exit
) > "%INSTALL_DIR%\Launch SmartFleet Manager.bat"

:: Create uninstaller
(
echo @echo off
echo chcp 65001 ^>nul 2^>^&1
echo title SmartFleet Manager - Uninstall
echo.
echo  Closing SmartFleet Manager...
echo  taskkill /F /IM "SmartFleet Manager.exe" ^>nul 2^>^&1
echo  taskkill /F /IM electron.exe ^>nul 2^>^&1
echo  timeout /t 2 /nobreak ^>nul
echo.
echo  Removing shortcuts...
echo  del /Q "%%USERPROFILE%%\Desktop\SmartFleet Manager.lnk" ^>nul 2^>^&1
echo  del /Q "%%ProgramData%%\Microsoft\Windows\Start Menu\Programs\SmartFleet Manager.lnk" ^>nul 2^>^&1
echo.
echo  Remove installation directory?
echo  Location: %INSTALL_DIR%
echo  NOTE: Database is stored separately at:
echo  %APP_ROAMING%\db\
echo.
echo  choice /C YN /M "Remove installation files"
echo  if errorlevel 2 goto skip
echo  rmdir /S /Q "%INSTALL_DIR%"
echo :skip
echo.
echo  choice /C YN /M "Also remove database and app data"
echo  if errorlevel 2 goto done
echo  rmdir /S /Q "%APP_ROAMING%"
echo  rmdir /S /Q "%APP_DATA_DIR%"
echo :done
echo.
echo  SmartFleet Manager has been uninstalled.
echo  pause
) > "%INSTALL_DIR%\Uninstall SmartFleet Manager.bat"

echo  [OK] Configuration complete
echo.

:: ===== STEP 8: CLEANUP =====
echo  [8/8] Cleaning up...
rmdir /S /Q "%PARTS_DIR%" >nul 2>&1
echo  [OK] Cleanup done
echo.

:: ===== REGISTRY (optional app registration) =====
reg add "HKLM\SOFTWARE\SmartFleet Manager" /v InstallPath /t REG_SZ /d "%INSTALL_DIR%" /f >nul 2>&1
reg add "HKLM\SOFTWARE\SmartFleet Manager" /v Version /t REG_SZ /d "6.0.0" /f >nul 2>&1
reg add "HKLM\SOFTWARE\SmartFleet Manager" /v InstallDate /t REG_SZ /d "%date% %time%" /f >nul 2>&1
reg add "HKLM\SOFTWARE\SmartFleet Manager" /v DataPath /t REG_SZ /d "%APP_ROAMING%" /f >nul 2>&1

:: ===== COMPLETION =====
cls
color 0A
echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║                                                  ║
echo  ║       Installation Complete!                     ║
echo  ║                                                  ║
echo  ╚══════════════════════════════════════════════════╝
echo.
echo  Install Location:  %INSTALL_DIR%
echo  Database:          %APP_ROAMING%\db\custom.db
echo  Logs:              %INSTALL_DIR%\logs\
echo.
echo  Shortcuts created:
echo  [OK] Desktop:      SmartFleet Manager
echo  [OK] Start Menu:   SmartFleet Manager
echo.
echo  To uninstall:      Run "Uninstall SmartFleet Manager.bat"
echo.
echo  Starting SmartFleet Manager...
echo.

cd /D "%INSTALL_DIR%"
start "" "SmartFleet Manager.exe"

timeout /t 3 /nobreak >nul
exit
