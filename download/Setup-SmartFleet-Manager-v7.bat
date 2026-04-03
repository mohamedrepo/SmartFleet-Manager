@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion

title SmartFleet Manager v7 - Installer

echo.
echo ================================================================
echo.
echo        SmartFleet Manager v7.0 - Professional Installer
echo        SmartFleet Manager - Fleet Management System
echo.
echo ================================================================
echo.

:: ===== Step 1: Check Administrator =====
echo [1/7] Checking administrator privileges...
net session >nul 2>&1
if %errorLevel% neq 0 (
    color 0C
    echo.
    echo  ERROR: Administrator privileges required!
    echo  Right-click this file and select "Run as administrator".
    echo.
    pause
    exit /b 1
)
echo  OK
echo.

:: ===== Step 2: Check D: Drive =====
echo [2/7] Checking D: drive...
if not exist D:\ (
    color 0C
    echo  ERROR: D: drive not found!
    echo  The installation directory must be on D: drive.
    pause
    exit /b 1
)
echo  OK
echo.

:: ===== Step 3: Create Directory =====
echo [3/7] Creating installation directory...
set "INSTALL_DIR=D:\SmartFleetManager"
if exist "%INSTALL_DIR%" (
    echo  Cleaning old installation...
    rd /s /q "%INSTALL_DIR%" 2>nul
    timeout /t 2 /nobreak >nul
)
mkdir "%INSTALL_DIR%"
icacls "%INSTALL_DIR%" /grant "%USERNAME%:(OI)(CI)F" /T >nul 2>&1
echo  OK: %INSTALL_DIR%
echo.

:: ===== Step 4: Download Files =====
echo [4/7] Downloading application files...
echo  This may take several minutes...
echo.

set "TEMP_DIR=%TEMP%\SmartFleetInstall"
if exist "%TEMP_DIR%" rd /s /q "%TEMP_DIR%"
mkdir "%TEMP_DIR%"

echo  Downloading part 1/2 (95 MB)...
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri 'https://files.catbox.moe/fcclzl.part-aa' -OutFile '%TEMP_DIR%\part-aa'" 2>nul
if errorlevel 1 (
    echo  ERROR: Download failed! Check internet connection.
    pause
    exit /b 1
)
echo  OK

echo  Downloading part 2/2 (48 MB)...
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri 'https://files.catbox.moe/v6qqop.part-ab' -OutFile '%TEMP_DIR%\part-ab'" 2>nul
if errorlevel 1 (
    echo  ERROR: Download failed!
    pause
    exit /b 1
)
echo  OK
echo.

:: ===== Step 5: Extract =====
echo [5/7] Extracting files...
copy /b "%TEMP_DIR%\part-aa" + "%TEMP_DIR%\part-ab" "%TEMP_DIR%\app.zip" >nul
powershell -Command "Expand-Archive -Path '%TEMP_DIR%\app.zip' -DestinationPath '%INSTALL_DIR%' -Force" 2>nul
if errorlevel 1 (
    echo  ERROR: Extraction failed!
    pause
    exit /b 1
)

:: Verify critical files
set "MISSING=0"
if not exist "%INSTALL_DIR%\electron.exe" (
    echo  MISSING: electron.exe
    set "MISSING=1"
)
if not exist "%INSTALL_DIR%\resources\app\server.js" (
    echo  MISSING: server.js
    set "MISSING=1"
)
if not exist "%INSTALL_DIR%\resources\app\electron\main.js" (
    echo  MISSING: main.js
    set "MISSING=1"
)
if not exist "%INSTALL_DIR%\resources\app\node_modules\.prisma\client\query_engine-windows.dll.node" (
    echo  MISSING: Prisma engine
    set "MISSING=1"
)
if "%MISSING%"=="1" (
    echo  ERROR: Installation corrupted!
    pause
    exit /b 1
)

icacls "%INSTALL_DIR%" /grant "%USERNAME%:(OI)(CI)F" /T >nul 2>&1
rd /s /q "%TEMP_DIR%" 2>nul
echo  OK
echo.

:: ===== Step 6: Shortcuts =====
echo [6/7] Creating shortcuts...
set "SHORTCUT_DESKTOP=%USERPROFILE%\Desktop\SmartFleet Manager.lnk"
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $sc = $ws.CreateShortcut('%SHORTCUT_DESKTOP%'); $sc.TargetPath = '%INSTALL_DIR%\electron.exe'; $sc.WorkingDirectory = '%INSTALL_DIR%'; $sc.Description = 'SmartFleet Manager'; $sc.Save()" 2>nul

set "SHORTCUT_START=%ProgramData%\Microsoft\Windows\Start Menu\Programs\SmartFleet Manager.lnk"
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $sc = $ws.CreateShortcut('%SHORTCUT_START%'); $sc.TargetPath = '%INSTALL_DIR%\electron.exe'; $sc.WorkingDirectory = '%INSTALL_DIR%'; $sc.Description = 'SmartFleet Manager'; $sc.Save()" 2>nul

:: Uninstaller
(
echo @echo off
echo chcp 65001 ^>nul 2^>^&1
echo title Uninstall SmartFleet Manager
echo echo.
echo echo Uninstall SmartFleet Manager?
echo set /p c=Type YES to confirm: 
echo if /i not "%%c%%"=="YES" exit /b 0
echo taskkill /f /im electron.exe ^>nul 2^>^&1
echo timeout /t 2 /nobreak ^>nul
echo rd /s /q "%INSTALL_DIR%"
echo del /f /q "%USERPROFILE%\Desktop\SmartFleet Manager.lnk" ^>nul 2^>^&1
echo del /f /q "%ProgramData%\Microsoft\Windows\Start Menu\Programs\SmartFleet Manager.lnk" ^>nul 2^>^&1
echo echo Uninstalled.
echo pause
) > "%INSTALL_DIR%\Uninstall.bat"

echo  OK
echo.

:: ===== Step 7: Launch =====
echo [7/7] Done!
echo.
echo ================================================================
echo.
echo  SUCCESS! SmartFleet Manager v7.0 installed!
echo.
echo  Install: %INSTALL_DIR%
echo  Database: %%APPDATA%%\SmartFleet Manager\db\
echo.
echo  Desktop shortcut: SmartFleet Manager
echo  Uninstall: %INSTALL_DIR%\Uninstall.bat
echo.
echo ================================================================
echo.

set /p LAUNCH="Launch now? (Y/N): "
if /i "%LAUNCH%"=="Y" (
    start "" "%INSTALL_DIR%\electron.exe"
)

endlocal
