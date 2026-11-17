@echo off
setlocal

rem ---------------------------------------------------------------------------
rem Runs the IncidentReports Playwright tests in Google Chrome.
rem
rem Usage (double-click, or from a command prompt in this folder):
rem   run-tests.bat                        Run all IncidentReports tests
rem   run-tests.bat "filtering by title"   Run only tests whose name contains the text
rem
rem Author: vishal.bhut
rem ---------------------------------------------------------------------------

rem Always run from the project folder, wherever the file is started from.
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is not installed. Install it from https://nodejs.org/ and run this file again.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing dependencies...
  call npm install --no-package-lock --no-audit --no-fund
  if errorlevel 1 (
    echo Dependency installation failed.
    pause
    exit /b 1
  )
)

rem Chrome only; these override the values in .env for this run.
set "BROWSER=chrome"
set "TEST_NAME=IncidentReports"

if "%~1"=="" (
  echo Running all IncidentReports tests in Chrome...
  call npx playwright test --project=local
) else (
  echo Running IncidentReports tests matching "%~1" in Chrome...
  call npx playwright test --project=local -g "%~1"
)
set "EXIT_CODE=%ERRORLEVEL%"

echo.
if "%EXIT_CODE%"=="0" (
  echo All tests passed.
) else (
  echo Some tests failed. Exit code: %EXIT_CODE%
)
set "REPORT=%~dp0test-results\report\index.html"
set "MONOCART_REPORT=%~dp0test-results\monocart-report\index.html"
echo Playwright HTML report: %REPORT%
echo Monocart report       : %MONOCART_REPORT%
echo Execution log         : %~dp0test-results\logs\execution.log

rem Open the Monocart report in the default browser.
if exist "%MONOCART_REPORT%" (
  echo Opening the Monocart report in your default browser...
  start "" "%MONOCART_REPORT%"
)
pause
exit /b %EXIT_CODE%
