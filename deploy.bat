@echo off
echo === Global Financial Services - Build and Deploy Script ===
echo Starting build and deployment process...
echo.

:: Step 1: Development Build
echo Step 1: Building Angular app (development)...
call ng build
if errorlevel 1 (
    echo ERROR: Development build failed!
    echo Exiting script due to error.
    pause
    exit /b 1
)
echo SUCCESS: Development build completed!
echo.

:: Step 2: Production Build
echo Step 2: Building Angular app (production)...
call ng build --configuration production
if errorlevel 1 (
    echo ERROR: Production build failed!
    echo Exiting script due to error.
    pause
    exit /b 1
)
echo SUCCESS: Production build completed!
echo.

:: Step 3: Firebase Deploy
echo Step 3: Deploying to Firebase hosting...
call firebase deploy --only hosting
if errorlevel 1 (
    echo ERROR: Firebase deployment failed!
    echo Exiting script due to error.
    pause
    exit /b 1
)
echo SUCCESS: Firebase deployment completed!
echo.

:: Step 4: Git Operations
echo Step 4: Committing changes to git...

:: Check if there are changes
git status --porcelain > temp_status.txt
for %%A in (temp_status.txt) do set size=%%~zA
del temp_status.txt

if %size% gtr 0 (
    echo Changes detected. Adding all files to git...
    git add .
    if errorlevel 1 (
        echo ERROR: Git add failed!
        pause
        exit /b 1
    )
    
    :: Create commit message with timestamp
    for /f "tokens=1-4 delims=/ " %%i in ("%date%") do (
        for /f "tokens=1-2 delims=: " %%m in ("%time%") do (
            set timestamp=%%l-%%j-%%k %%m:%%n
        )
    )
    
    git commit -m "Deploy: Build and deploy completed successfully - %timestamp%"
    if errorlevel 1 (
        echo ERROR: Git commit failed!
        pause
        exit /b 1
    )
    
    echo Pushing changes to remote repository...
    git push
    if errorlevel 1 (
        echo ERROR: Git push failed!
        pause
        exit /b 1
    )
    echo SUCCESS: Git operations completed!
) else (
    echo No changes detected in git. Skipping commit.
)

echo.
echo SUCCESS! All operations completed successfully!
echo - Development build completed
echo - Production build completed
echo - Firebase deployment completed
echo - Git operations completed
echo.
echo Your application has been successfully built, deployed, and committed to git!
echo === Deployment Complete ===
pause
