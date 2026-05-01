@echo off
REM Water Station API - Quick Start Setup Script (Windows)
REM This script automates the initial setup process

echo.
echo 🚀 Water Station API - Quick Setup
echo ====================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js version: %NODE_VERSION%
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    exit /b 1
)

echo ✅ Dependencies installed
echo.

REM Create .env file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file from template...
    copy .env.example .env
    echo ✅ .env file created - Please update with your Aiven credentials
) else (
    echo ✅ .env file already exists
)

echo.
echo 🎉 Setup complete!
echo.
echo Next steps:
echo 1. Update .env with your Aiven MySQL credentials:
echo    - AIVEN_DB_HOST=your-aiven-host.a.aivencloud.com
echo    - AIVEN_DB_USER=avnadmin
echo    - AIVEN_DB_PASSWORD=your-password
echo.
echo 2. Run migrations to create tables:
echo    npm run migrate
echo.
echo 3. Seed database with sample data (optional):
echo    npm run seed
echo.
echo 4. Start development server:
echo    npm run dev
echo.
echo For detailed setup, see:
echo    - README.md - Project overview
echo    - AIVEN_SETUP.md - Aiven MySQL setup
echo    - GITHUB_SETUP.md - GitHub and deployment
echo    - API_DOCUMENTATION.md - API endpoints
echo.
