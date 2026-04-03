@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion

title SmartFleet Manager v6.1 - Installer

:: ═══════════════════════════════════════════════════════════
:: SmartFleet Manager v6.1 - Professional Windows Installer
:: Target: Windows 11 x64 - Install to D:\SmartFleetManager
:: ═══════════════════════════════════════════════════════════

color 0A
echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║                                                          ║
echo ║        SmartFleet Manager v6.1 - Installer               ║
echo ║        النظام الذكي لإدارة الأسطول                        ║
echo ║                                                          ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

:: ===== Step 1: Check Administrator =====
echo [Step 1/7] Checking administrator privileges...
net session >nul 2>&1
if %errorLevel% neq 0 (
    color 0C
    echo.
    echo  [ERROR] This installer requires administrator privileges!
    echo  Right-click the file and select "Run as administrator".
    echo.
    pause
    exit /b 1
)
echo  [OK] Administrator privileges confirmed.
echo.

:: ===== Step 2: Check Windows 11 =====
echo [Step 2/7] Checking Windows version...
ver | findstr /i "10.0.2" >nul 2>&1
if %errorLevel% neq 0 (
    color 0E
    echo  [WARNING] This installer is designed for Windows 11.
    echo  Continuing anyway - some features may not work.
)
echo  [OK] Windows version detected.
echo.

:: ===== Step 3: Check D: Drive =====
echo [Step 3/7] Checking D: drive availability...
if not exist D:\ (
    color 0C
    echo.
    echo  [ERROR] D: drive not found!
    echo  Please ensure you have a D: drive or modify the installer.
    echo.
    pause
    exit /b 1
)
echo  [OK] D: drive found.
echo.

:: ===== Step 4: Create Directory Structure =====
echo [Step 4/7] Creating installation directory...
set "INSTALL_DIR=D:\SmartFleetManager"

if exist "%INSTALL_DIR%" (
    echo  [INFO] Directory exists, cleaning old installation...
    rd /s /q "%INSTALL_DIR%" 2>nul
    timeout /t 2 /nobreak >nul
)

mkdir "%INSTALL_DIR%"
if %errorLevel% neq 0 (
    color 0C
    echo  [ERROR] Failed to create installation directory!
    pause
    exit /b 1
)

:: Set permissions
echo  Setting directory permissions...
icacls "%INSTALL_DIR%" /grant "%USERNAME%:(OI)(CI)F" /T >nul 2>&1
icacls "%INSTALL_DIR%" /grant "Users:(OI)(CI)RX" /T >nul 2>&1
echo  [OK] Installation directory ready: %INSTALL_DIR%
echo.

:: ===== Step 5: Download Application Files =====
echo [Step 5/7] Downloading application files...
echo  This may take a few minutes depending on your internet speed...
echo.

set "PART1_URL=https://files.catbox.moe/71vq7a.part-aa"
set "PART2_URL=https://files.catbox.moe/hx92ay.part-ab"
set "TEMP_DIR=%TEMP%\SmartFleetInstall"

:: Clean temp dir
if exist "%TEMP_DIR%" rd /s /q "%TEMP_DIR%"
mkdir "%TEMP_DIR%"

:: Download Part 1
echo  Downloading Part 1/2 (95 MB)...
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri '%PART1_URL%' -OutFile '%TEMP_DIR%\part-aa'" 2>nul
if %errorLevel% neq 0 (
    echo  [ERROR] Failed to download Part 1!
    echo  Check your internet connection and try again.
    pause
    exit /b 1
)
echo  [OK] Part 1 downloaded.

:: Download Part 2
echo  Downloading Part 2/2 (41 MB)...
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri '%PART2_URL%' -OutFile '%TEMP_DIR%\part-ab'" 2>nul
if %errorLevel% neq 0 (
    echo  [ERROR] Failed to download Part 2!
    echo  Check your internet connection and try again.
    pause
    exit /b 1
)
echo  [OK] Part 2 downloaded.
echo.

:: ===== Step 6: Extract and Install =====
echo [Step 6/7] Extracting and installing...
echo  Combining parts...
copy /b "%TEMP_DIR%\part-aa" + "%TEMP_DIR%\part-ab" "%TEMP_DIR%\SmartFleet-Manager-v6.1.zip" >nul
if %errorLevel% neq 0 (
    color 0C
    echo  [ERROR] Failed to combine parts!
    pause
    exit /b 1
)

echo  Extracting archive...
powershell -Command "Expand-Archive -Path '%TEMP_DIR%\SmartFleet-Manager-v6.1.zip' -DestinationPath '%INSTALL_DIR%' -Force" 2>nul
if %errorLevel% neq 0 (
    color 0C
    echo  [ERROR] Failed to extract files!
    pause
    exit /b 1
)

:: Verify critical files
echo  Verifying installation...
if not exist "%INSTALL_DIR%\electron.exe" (
    color 0C
    echo  [ERROR] electron.exe not found! Installation corrupted.
    pause
    exit /b 1
)
if not exist "%INSTALL_DIR%\resources\app\server.js" (
    color 0C
    echo  [ERROR] Server files not found! Installation corrupted.
    pause
    exit /b 1
)
if not exist "%INSTALL_DIR%\resources\app\electron\main.js" (
    color 0C
    echo  [ERROR] Main process not found! Installation corrupted.
    pause
    exit /b 1
)
if not exist "%INSTALL_DIR%\resources\app\electron\db.js" (
    color 0C
    echo  [ERROR] Database module not found! Installation corrupted.
    pause
    exit /b 1
)

:: Set final permissions
icacls "%INSTALL_DIR%" /grant "%USERNAME%:(OI)(CI)F" /T >nul 2>&1

:: Cleanup temp files
echo  Cleaning up temporary files...
rd /s /q "%TEMP_DIR%" 2>nul

echo  [OK] Installation complete!
echo.

:: ===== Step 7: Create Shortcuts =====
echo [Step 7/7] Creating shortcuts...

:: Desktop Shortcut
set "SHORTCUT_DESKTOP=%USERPROFILE%\Desktop\SmartFleet Manager v6.1.lnk"
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $sc = $ws.CreateShortcut('%SHORTCUT_DESKTOP%'); $sc.TargetPath = '%INSTALL_DIR%\electron.exe'; $sc.WorkingDirectory = '%INSTALL_DIR%'; $sc.Description = 'SmartFleet Manager - Fleet Management System'; $sc.Save()" 2>nul
echo  [OK] Desktop shortcut created.

:: Start Menu Shortcut
set "SHORTCUT_START=%ProgramData%\Microsoft\Windows\Start Menu\Programs\SmartFleet Manager v6.1.lnk"
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $sc = $ws.CreateShortcut('%SHORTCUT_START%'); $sc.TargetPath = '%INSTALL_DIR%\electron.exe'; $sc.WorkingDirectory = '%INSTALL_DIR%'; $sc.Description = 'SmartFleet Manager - Fleet Management System'; $sc.Save()" 2>nul
echo  [OK] Start Menu shortcut created.

:: Create Uninstaller
set "UNINSTALLER=%INSTALL_DIR%\Uninstall.bat"
(
echo @echo off
echo chcp 65001 ^>nul 2^>^&1
echo title SmartFleet Manager - Uninstaller
echo echo.
echo echo Are you sure you want to uninstall SmartFleet Manager v6.1?
echo echo Installation directory: %INSTALL_DIR%
echo echo.
echo set /p confirm=Type YES to confirm: 
echo if /i not "%%confirm%%"=="YES" exit /b 0
echo echo.
echo echo Uninstalling...
echo taskkill /f /im electron.exe ^>nul 2^>^&1
echo timeout /t 2 /nobreak ^>nul
echo rd /s /q "%INSTALL_DIR%"
echo del /f /q "%USERPROFILE%\Desktop\SmartFleet Manager v6.1.lnk" ^>nul 2^>^&1
echo del /f /q "%ProgramData%\Microsoft\Windows\Start Menu\Programs\SmartFleet Manager v6.1.lnk" ^>nul 2^>^&1
echo echo.
echo echo SmartFleet Manager has been uninstalled.
echo pause
) > "%UNINSTALLER%"
echo  [OK] Uninstaller created at: %INSTALL_DIR%\Uninstall.bat
echo.

:: ===== DONE =====
color 0A
echo ═══════════════════════════════════════════════════════════
echo.
echo  SUCCESS! SmartFleet Manager v6.1 installed successfully!
echo.
echo  Installation directory: %INSTALL_DIR%
echo  Database location: %%APPDATA%%\SmartFleet Manager\db\
echo.
echo  You can launch the application from:
echo    - Desktop shortcut: SmartFleet Manager v6.1
echo    - Start Menu: SmartFleet Manager v6.1
echo    - Direct: %INSTALL_DIR%\electron.exe
echo.
echo  To uninstall: Run %INSTALL_DIR%\Uninstall.bat
echo.
echo ═══════════════════════════════════════════════════════════
echo.

:: Ask to launch
set /p LAUNCH="Launch SmartFleet Manager now? (Y/N): "
if /i "%LAUNCH%"=="Y" (
    echo.
    echo  Starting SmartFleet Manager...
    start "" "%INSTALL_DIR%\electron.exe"
)

endlocal
