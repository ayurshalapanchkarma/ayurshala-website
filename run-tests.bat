@echo off
REM Inventory Module E2E Test Runner (Windows)

echo.
echo ==========================================
echo   Ayurshala Inventory E2E Test Suite
echo ==========================================
echo.

REM Check if node is installed
where node >nul 2>nul
if errorlevel 1 (
    echo Error: Node.js not found. Please install Node.js 18+
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if errorlevel 1 (
    echo Error: npm not found. Please install npm
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
for /f "tokens=*" %%i in ('npm -v') do set NPM_VER=%%i

echo Node.js version: %NODE_VER%
echo npm version: %NPM_VER%
echo.

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Check if playwright is installed
npm list @playwright/test >nul 2>&1
if errorlevel 1 (
    echo Installing Playwright...
    call npm install -D @playwright/test
    echo.
)

REM Set environment
if not defined BASE_URL set BASE_URL=http://localhost:3000

echo Running Inventory Module E2E Tests
echo URL: %BASE_URL%
echo.

REM Parse arguments
if "%1"=="" goto all
if "%1"=="all" goto all
if "%1"=="ui" goto ui
if "%1"=="headed" goto headed
if "%1"=="masters" goto masters
if "%1"=="po" goto po
if "%1"=="grn" goto grn
if "%1"=="reports" goto reports
if "%1"=="api" goto api
if "%1"=="comprehensive" goto comprehensive
if "%1"=="debug" goto debug
if "%1"=="ci" goto ci
if "%1"=="report" goto report
goto usage

:all
echo Running all tests...
call npm run test:inventory
goto end

:ui
echo Running tests with UI...
call npm run test:inventory:ui
goto end

:headed
echo Running tests with headed browser...
call npm run test:inventory:headed
goto end

:masters
echo Running masters tests...
call npm run test:masters
goto end

:po
echo Running purchase order tests...
call npm run test:purchase-orders
goto end

:grn
echo Running GRN tests...
call npm run test:grn
goto end

:reports
echo Running report tests...
call npm run test:reports
goto end

:api
echo Running API tests...
call npm run test:api
goto end

:comprehensive
echo Running comprehensive validation...
call npm run test:comprehensive
goto end

:debug
echo Running tests in debug mode...
call npm run test:inventory:debug
goto end

:ci
echo Running tests in CI mode...
call npm run test:inventory:ci
goto end

:report
echo Opening test report...
call npm run test:inventory:report
goto end

:usage
echo Usage: run-tests.bat [command]
echo.
echo Commands:
echo   all            Run all tests
echo   ui             Run tests with UI mode
echo   headed         Run tests with visible browser
echo   masters        Run masters module tests
echo   po             Run purchase order tests
echo   grn            Run GRN tests
echo   reports        Run reports tests
echo   api            Run API tests
echo   comprehensive  Run comprehensive validation
echo   debug          Run tests in debug mode
echo   ci             Run tests in CI mode
echo   report         Open HTML report
echo.
exit /b 1

:end
echo.
echo Test suite completed
echo.
echo To view detailed results, run:
echo   npm run test:inventory:report
