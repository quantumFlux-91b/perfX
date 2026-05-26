@echo off
SETLOCAL Enabledelayedexpansion

title PerfX Runner

echo ===================================================
echo   ⚡ PerfX - Local Development Starter ⚡
echo ===================================================
echo.

:: Check for Java installation
java -version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Java is not detected in your PATH. 
    echo Please make sure Java 21 is installed and JAVA_HOME is configured.
    echo.
)

:: Check for Node.js
node -v >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Node.js is not detected in your PATH.
    echo Please make sure Node.js v20 or higher is installed.
    echo.
)


:: Handle Frontend dependencies if node_modules doesn't exist
if not exist "%~dp0frontend\node_modules\" (
    echo [INFO] node_modules not found in frontend. Installing dependencies...
    pushd "%~dp0frontend"
    call npm install
    popd
)

echo [INFO] Starting Backend (Spring Boot)...
start "PerfX Backend" /D "%~dp0backend" cmd /k "mvnw.cmd spring-boot:run"

echo [INFO] Starting Frontend (Vite)...
start "PerfX Frontend" /D "%~dp0frontend" cmd /k "npm run dev"

echo.
echo ===================================================
echo   🚀 Services starting!
echo   - Backend:  http://localhost:8080
echo   - Frontend: http://localhost:5173
echo ===================================================
echo.
pause
