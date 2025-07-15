@echo off
REM Quick backup script for Global Financial Services project
echo Creating backup before making changes...

REM Get current date and time for backup tag
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "timestamp=%YYYY%%MM%%DD%_%HH%%Min%"

REM Create backup tag
git tag -a backup_%timestamp% -m "Automatic backup before changes on %DD%/%MM%/%YYYY% at %HH%:%Min%"

REM Show current status
echo.
echo Current Git status:
git status

echo.
echo Backup tag created: backup_%timestamp%
echo.
echo To restore to this backup later, use:
echo git reset --hard backup_%timestamp%
echo.
pause
