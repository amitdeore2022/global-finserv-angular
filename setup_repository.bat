@echo off
echo.
echo ============================================
echo   GitHub Repository Setup Guide
echo ============================================
echo.
echo The repository 'global-finserv-angular' doesn't exist yet.
echo You have several options:
echo.
echo OPTION 1 - Create on GitHub Website:
echo 1. Go to https://github.com/amitdeore2022
echo 2. Click "New repository" (green button)
echo 3. Name: global-finserv-angular
echo 4. Description: Global Financial Services - Angular Invoice Management System
echo 5. Make it Private (recommended)
echo 6. DO NOT initialize with README
echo 7. Click "Create repository"
echo 8. Then run: git push -u origin main
echo.
echo OPTION 2 - Use GitHub CLI (if installed):
echo gh repo create global-finserv-angular --private --source=. --remote=origin --push
echo.
echo OPTION 3 - Alternative Repository Names:
echo If the name is taken, try:
echo - global-finserv-app
echo - finserv-invoice-system
echo - invoice-management-angular
echo.
echo Current remote URL: https://github.com/amitdeore2022/global-finserv-angular.git
echo.
echo ============================================
echo After creating the repository, run:
echo   git push -u origin main
echo   git push origin --tags
echo ============================================
echo.
pause
