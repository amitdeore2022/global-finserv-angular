@echo off
echo =======================================================
echo         Global FinServ PWA Icon Generator
echo =======================================================
echo.
echo Choose an option:
echo 1. Open Icon Generator in Browser
echo 2. Run PowerShell Icon Helper
echo 3. Open Online Favicon Generator
echo 4. Build and Deploy App
echo 5. Exit
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" (
    echo Opening Icon Generator...
    start "" "public\icon-generator.html"
) else if "%choice%"=="2" (
    echo Running PowerShell helper...
    powershell -ExecutionPolicy Bypass -File "public\generate-icons.ps1"
    pause
) else if "%choice%"=="3" (
    echo Opening online favicon generator...
    start "" "https://realfavicongenerator.net/"
) else if "%choice%"=="4" (
    echo Building and deploying application...
    call npm run build
    if %errorlevel%==0 (
        call firebase deploy --only hosting
    )
    pause
) else if "%choice%"=="5" (
    exit
) else (
    echo Invalid choice. Please try again.
    pause
    goto :EOF
)

echo.
echo Done! Check PWA_ICON_FIX.md for detailed instructions.
pause
