@echo off
title Global Financial Services - Deployment Script Selector
echo ==========================================
echo  Global Financial Services
echo  Build and Deploy Script Selector
echo ==========================================
echo.
echo Select your preferred deployment method:
echo.
echo 1. PowerShell Script (Recommended for Windows)
echo 2. Batch Script (Simple Windows execution)
echo 3. Show deployment guide
echo 4. Exit
echo.
set /p choice=Enter your choice (1-4): 

if "%choice%"=="1" (
    echo.
    echo Starting PowerShell deployment script...
    powershell -ExecutionPolicy Bypass -File deploy.ps1
    goto end
)

if "%choice%"=="2" (
    echo.
    echo Starting batch deployment script...
    call deploy.bat
    goto end
)

if "%choice%"=="3" (
    echo.
    echo Opening deployment guide...
    if exist DEPLOYMENT_GUIDE.md (
        notepad DEPLOYMENT_GUIDE.md
    ) else (
        echo DEPLOYMENT_GUIDE.md not found in current directory.
    )
    echo.
    echo Press any key to return to menu...
    pause >nul
    cls
    goto :start
)

if "%choice%"=="4" (
    echo.
    echo Exiting...
    goto end
)

echo.
echo Invalid choice. Please select 1, 2, 3, or 4.
echo.
pause
cls
goto :start

:start
goto :eof

:end
echo.
echo Press any key to exit...
pause >nul
