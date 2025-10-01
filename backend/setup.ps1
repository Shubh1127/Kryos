Write-Host "🚀 Setting up Kryos Backend..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed. Please install npm first." -ForegroundColor Red
    exit 1
}

Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host "📁 Creating necessary directories..." -ForegroundColor Yellow
if (!(Test-Path "uploads")) { New-Item -ItemType Directory -Path "uploads" }
if (!(Test-Path "temp")) { New-Item -ItemType Directory -Path "temp" }

Write-Host "📝 Setting up environment file..." -ForegroundColor Yellow
if (!(Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created .env file from .env.example" -ForegroundColor Green
    Write-Host "⚠️  Please update the .env file with your configuration!" -ForegroundColor Yellow
} else {
    Write-Host "⚠️  .env file already exists" -ForegroundColor Yellow
}

Write-Host "🔧 Building TypeScript..." -ForegroundColor Yellow
npm run build

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To start the development server:" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "To start the production server:" -ForegroundColor Cyan
Write-Host "  npm start" -ForegroundColor White
Write-Host ""
Write-Host "Make sure to:" -ForegroundColor Yellow
Write-Host "1. Update your .env file with proper configuration" -ForegroundColor White
Write-Host "2. Start MongoDB service" -ForegroundColor White
Write-Host "3. Review the API documentation in README.md" -ForegroundColor White