@echo off
REM ============================================
REM Drishti Kavach - Production Setup Script
REM दृष्टि कवच - The Vision Shield
REM ============================================

echo.
echo 🛡️ Drishti Kavach Production Setup
echo.
echo This script will help you configure production settings.
echo.

REM Check if backend .env exists
if not exist "backend\.env" (
    echo [ERROR] backend\.env not found!
    echo Please run this script from the Drishti Kavach root directory.
    pause
    exit /b 1
)

echo [INFO] Checking environment files...
if exist "backend\.env" echo [OK] backend\.env found
if exist "frontend\.env" echo [OK] frontend\.env found
if exist "backend\.secrets.txt" echo [OK] .secrets.txt found

echo.
echo ============================================
echo ⚠️  REQUIRED: Configure External Services
echo ============================================
echo.
echo Before deploying, you MUST configure:
echo.
echo 1️⃣  Cloudflare Turnstile
echo    → Get keys from: https://dash.cloudflare.com/
echo    → Add TURNSTILE_SECRET_KEY to backend\.env
echo    → Add VITE_TURNSTILE_SITE_KEY to frontend\.env
echo.
echo 2️⃣  EmailJS
echo    → Get credentials from: https://www.emailjs.com/
echo    → Add EMAILJS_SERVICE_ID, TEMPLATE_ID, PUBLIC_KEY to backend\.env
echo.
echo 3️⃣  Production API URL
echo    → Update VITE_API_URL in frontend\.env to your deployed backend URL
echo.
echo ============================================
echo 🚀 Quick Deploy Commands
echo ============================================
echo.
echo Deploy Backend to Render:
echo    1. Go to https://render.com/
echo    2. New Web Service → Connect GitHub
echo    3. Root Directory: Drishti Kavach/backend
echo    4. Build: npm install, Start: npm run dev
echo    5. Add all environment variables from backend\.env
echo.
echo Deploy Frontend to Vercel:
echo    1. Go to https://vercel.com/
echo    2. New Project → Import GitHub
echo    3. Root Directory: Drishti Kavach/frontend
echo    4. Build: npm run build
echo    5. Add all environment variables from frontend\.env
echo.
echo ============================================
echo ✅ After Configuration, Run:
echo ============================================
echo.
echo cd Drishti Kavach\frontend
echo npm run build
echo.
echo ============================================
pause