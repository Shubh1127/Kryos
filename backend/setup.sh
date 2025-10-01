#!/bin/bash

echo "🚀 Setting up Kryos Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "📁 Creating necessary directories..."
mkdir -p uploads temp

echo "📝 Setting up environment file..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file from .env.example"
    echo "⚠️  Please update the .env file with your configuration!"
else
    echo "⚠️  .env file already exists"
fi

echo "🔧 Building TypeScript..."
npm run build

echo "✅ Setup complete!"
echo ""
echo "To start the development server:"
echo "  npm run dev"
echo ""
echo "To start the production server:"
echo "  npm start"
echo ""
echo "Make sure to:"
echo "1. Update your .env file with proper configuration"
echo "2. Start MongoDB service"
echo "3. Review the API documentation in README.md"