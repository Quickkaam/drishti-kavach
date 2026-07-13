@echo off
echo ============================================
echo Drishti Kavach - Installation & Setup
echo ============================================
echo.

echo Step 1: Installing Backend Dependencies...
cd backend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Backend dependencies installation failed!
    pause
    exit /b 1
)
echo ✅ Backend dependencies installed

echo.
echo Step 2: Installing Frontend Dependencies...
cd ..\frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Frontend dependencies installation failed!
    pause
    exit /b 1
)
echo ✅ Frontend dependencies installed

echo.
echo Step 3: Setting up Database...
cd ..\backend
echo Running database setup...
node src/db/setup.js
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Database setup completed with warnings
    echo You can continue, but some features may not work properly
) else (
    echo ✅ Database setup successful!
)

echo.
echo ============================================
echo 🎉 Installation Complete!
echo.
echo Next steps:
echo 1. Open TWO terminals
echo 2. Terminal 1: cd backend && npm run dev
echo 3. Terminal 2: cd frontend && npm run dev
echo 4. Open browser to: http://localhost:5173
echo 5. Login with:
echo    Email: whitehatwolf22@gmail.com
echo    Password: Coco@22/07/2001
echo.
echo ============================================
pause