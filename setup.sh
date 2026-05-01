#!/bin/bash

# Water Station API - Quick Start Setup Script
# This script automates the initial setup process

echo "🚀 Water Station API - Quick Setup"
echo "===================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created - Please update with your Aiven credentials"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your Aiven MySQL credentials:"
echo "   - AIVEN_DB_HOST=your-aiven-host.a.aivencloud.com"
echo "   - AIVEN_DB_USER=avnadmin"
echo "   - AIVEN_DB_PASSWORD=your-password"
echo ""
echo "2. Run migrations to create tables:"
echo "   npm run migrate"
echo ""
echo "3. Seed database with sample data (optional):"
echo "   npm run seed"
echo ""
echo "4. Start development server:"
echo "   npm run dev"
echo ""
echo "For detailed setup, see:"
echo "   - README.md - Project overview"
echo "   - AIVEN_SETUP.md - Aiven MySQL setup"
echo "   - GITHUB_SETUP.md - GitHub & deployment"
echo "   - API_DOCUMENTATION.md - API endpoints"
echo ""
