@echo off
echo ============================================
echo Drishti Kavach - Database Setup
echo ============================================
echo.
echo Checking environment variables...
echo.

if not exist .env (
    echo ❌ .env file not found in backend folder!
    echo.
    echo Please create a .env file with your Supabase credentials from the dashboard:
    echo   SUPABASE_URL=https://[your-project].supabase.co
    echo   SUPABASE_ANON_KEY=[your-anon-key]
    echo   SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
    echo.
    echo Then run this script again.
    pause
    exit /b 1
)

echo ✅ .env file found
echo.
echo Setting up database tables...
echo This will:
echo   1. Create all database tables
echo   2. Set up super admin account
echo   3. Seed first website (quickkaam.in)
echo.
pause

echo.
echo Running setup...
node src/db/setup.js

echo.
pause