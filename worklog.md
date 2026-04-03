---
Task ID: 1
Agent: Main Agent
Task: Fix SmartFleet Manager window open/close loop crash

Work Log:
- Diagnosed the root cause: electron/db.js was never included in the packaged app
- The build script only copied electron/main.js and electron/preload.js to standalone
- main.js line 8 has `require('./db')` which threw MODULE_NOT_FOUND and crashed the process
- Rewrote electron/main.js with inline setupDatabase() (self-contained, no external deps)
- Added 6 path detection strategies for finding server.js
- Added 4 Prisma engine path detection strategies
- Added comprehensive error handling with user-friendly error dialogs
- Added fallback temp database if userData path fails
- Fixed window lifecycle: no auto-recreate on Windows (macOS only for activate)
- Added did-fail-load and render-process-gone handlers
- Updated build script to copy electron/db.js and use --webpack flag
- Updated pre-package.js to copy ALL electron files (main.js, preload.js, db.js)
- Bumped version to 6.1.0
- Rebuilt Next.js standalone successfully
- Downloaded Electron v28.3.3 Windows x64 binary
- Assembled package with correct file structure
- Verified all critical files present
- Created ZIP and split into 2 parts
- Uploaded to catbox.moe
- Created Setup-SmartFleet-Manager-v6.1.bat installer
- Pushed all changes to GitHub

Stage Summary:
- Root cause: Missing electron/db.js in packaged app caused immediate crash on startup
- Fix: Inlined db.js into main.js + added to build pipeline
- v6.1 package uploaded: Part 1 (71vq7a.part-aa), Part 2 (hx92ay.part-ab)
- Installer: download/Setup-SmartFleet-Manager-v6.1.bat
- GitHub: pushed to mohamedrepo/SmartFleet-Manager
- Package structure verified: electron.exe + resources/app/ with all files
