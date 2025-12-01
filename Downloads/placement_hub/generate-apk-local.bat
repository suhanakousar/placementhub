@echo off
REM Script to generate APK from local build without deployment
REM Usage: generate-apk-local.bat

echo.
echo 🚀 Generating APK from Local Build
echo ==================================
echo.

REM Check if we're in the right directory
if not exist "client" (
    echo ❌ Error: 'client' directory not found. Run this from project root.
    pause
    exit /b 1
)

REM Step 1: Build the React app
echo.
echo 📦 Step 1: Building React app...
cd client
call npm run build

if errorlevel 1 (
    echo ❌ Build failed!
    pause
    exit /b 1
)

echo ✅ Build complete!
echo.

REM Step 2: Check if ngrok is available
echo 🌐 Step 2: Setting up HTTPS tunnel...
echo.

where ngrok >nul 2>nul
if errorlevel 1 (
    echo ⚠️  ngrok not found.
    echo.
    echo 📝 Please install ngrok:
    echo 1. Download from: https://ngrok.com/download
    echo 2. Or run: npm install -g ngrok
    echo 3. Then run this script again
    echo.
    echo Alternative: Use localhost
    echo 1. Run: npm run serve
    echo 2. Go to: https://pwa-builder.com
    echo 3. Enter: http://localhost:3000
    echo.
    pause
    exit /b 1
)

echo ✅ ngrok found
echo.
echo Starting local server and ngrok tunnel...
echo.
echo 📝 Instructions:
echo 1. A local server will start on port 3000
echo 2. ngrok will create a public HTTPS URL
echo 3. Copy the HTTPS URL from ngrok output
echo 4. Go to https://pwa-builder.com
echo 5. Enter the ngrok URL and generate APK
echo.
echo Press Ctrl+C to stop the servers when done
echo.

REM Start serve in background (Windows way)
start /B npx serve -s build -l 3000

REM Wait a moment for server to start
timeout /t 2 /nobreak >nul

REM Start ngrok
ngrok http 3000

pause

