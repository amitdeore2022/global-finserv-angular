@echo off
echo.
echo ============================================
echo   GitHub Authentication Fix Guide
echo ============================================
echo.
echo ISSUE: You're authenticated as 'gramprattinidhi' but need 'amitdeore2022'
echo.
echo SOLUTION OPTIONS:
echo.
echo OPTION 1 - Use Personal Access Token (Recommended):
echo 1. Go to GitHub.com → Settings → Developer settings → Personal access tokens
echo 2. Generate new token (classic) with 'repo' scope
echo 3. Copy the token
echo 4. Run: git remote set-url origin https://amitdeore2022:YOUR_TOKEN@github.com/amitdeore2022/global-finserv-angular.git
echo 5. Run: git push -u origin main
echo.
echo OPTION 2 - Clear Cached Credentials:
echo Run: git config --global --unset credential.helper
echo Then: git push -u origin main
echo (You'll be prompted for username/password)
echo.
echo OPTION 3 - Use SSH (If you have SSH keys):
echo Run: git remote set-url origin git@github.com:amitdeore2022/global-finserv-angular.git
echo Then: git push -u origin main
echo.
echo OPTION 4 - Windows Credential Manager:
echo 1. Open Control Panel → Credential Manager
echo 2. Remove any GitHub entries under "Windows Credentials"
echo 3. Try git push again (will prompt for new login)
echo.
echo ============================================
echo After fixing authentication, also run:
echo   git push origin --tags
echo ============================================
echo.
pause
