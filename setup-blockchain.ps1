# Kryos Blockchain Integration Setup Script (PowerShell)
Write-Host "🚀 Setting up Kryos Blockchain Integration..." -ForegroundColor Blue

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Success "Node.js is installed: $nodeVersion"
} catch {
    Write-Error "Node.js is not installed. Please install Node.js first."
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Success "npm is installed: $npmVersion"
} catch {
    Write-Error "npm is not installed. Please install npm first."
    exit 1
}

# Navigate to blockchain directory
Set-Location blockchain

Write-Status "Setting up Hardhat project..."

# Install dependencies
Write-Status "Installing Hardhat and dependencies..."
npm install --save-dev @nomicfoundation/hardhat-toolbox@^5.0.0 ethers --legacy-peer-deps

if ($LASTEXITCODE -eq 0) {
    Write-Success "Dependencies installed successfully"
} else {
    Write-Error "Failed to install dependencies"
    exit 1
}

# Compile smart contracts
Write-Status "Compiling smart contracts..."
npx hardhat compile

if ($LASTEXITCODE -eq 0) {
    Write-Success "Smart contracts compiled successfully"
} else {
    Write-Error "Failed to compile smart contracts"
    exit 1
}

# Start local Hardhat network
Write-Status "Starting local Hardhat network..."
Start-Process -FilePath "npx" -ArgumentList "hardhat", "node" -WindowStyle Hidden
$hardhatProcess = Get-Process | Where-Object { $_.ProcessName -eq "node" -and $_.CommandLine -like "*hardhat*" }

# Wait for network to start
Start-Sleep -Seconds 5

# Deploy smart contract
Write-Status "Deploying KryosDataHash contract..."
npx hardhat run scripts/deploy.js --network localhost

if ($LASTEXITCODE -eq 0) {
    Write-Success "Smart contract deployed successfully"
} else {
    Write-Error "Failed to deploy smart contract"
    Stop-Process -Id $hardhatProcess.Id -Force
    exit 1
}

# Navigate back to backend directory
Set-Location ../backend

# Install backend dependencies
Write-Status "Installing backend blockchain dependencies..."
npm install ethers crypto-js

if ($LASTEXITCODE -eq 0) {
    Write-Success "Backend dependencies installed successfully"
} else {
    Write-Error "Failed to install backend dependencies"
    Stop-Process -Id $hardhatProcess.Id -Force
    exit 1
}

# Create environment file
Write-Status "Creating blockchain environment configuration..."
$contractAddress = (Get-Content "../blockchain/contract-address.json" | ConvertFrom-Json).address

$envContent = @"
# Blockchain Configuration
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
BLOCKCHAIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
BLOCKCHAIN_WALLET_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
BLOCKCHAIN_CONTRACT_ADDRESS=$contractAddress
BLOCKCHAIN_CHAIN_ID=1337
"@

$envContent | Out-File -FilePath ".env.blockchain" -Encoding UTF8

Write-Success "Blockchain environment configuration created"

# Start backend server
Write-Status "Starting backend server..."
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Hidden
$backendProcess = Get-Process | Where-Object { $_.ProcessName -eq "node" -and $_.CommandLine -like "*backend*" }

# Wait for backend to start
Start-Sleep -Seconds 10

# Navigate to dashboard directory
Set-Location ../dashboard

# Install dashboard dependencies (if needed)
if (!(Test-Path "node_modules")) {
    Write-Status "Installing dashboard dependencies..."
    npm install
}

# Start dashboard
Write-Status "Starting dashboard..."
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Hidden
$dashboardProcess = Get-Process | Where-Object { $_.ProcessName -eq "node" -and $_.CommandLine -like "*dashboard*" }

Write-Success "🎉 Kryos Blockchain Integration Setup Complete!"
Write-Host ""
Write-Host "📋 Services Running:" -ForegroundColor Cyan
Write-Host "   🔗 Hardhat Network: http://localhost:8545" -ForegroundColor White
Write-Host "   🚀 Backend API: http://localhost:5000" -ForegroundColor White
Write-Host "   📊 Dashboard: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "📁 Important Files:" -ForegroundColor Cyan
Write-Host "   📄 Smart Contract: blockchain/contracts/KryosDataHash.sol" -ForegroundColor White
Write-Host "   🔧 Contract Address: blockchain/contract-address.json" -ForegroundColor White
Write-Host "   ⚙️  Backend Config: backend/.env.blockchain" -ForegroundColor White
Write-Host ""
Write-Host "🛠️  Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Check the dashboard at http://localhost:3000" -ForegroundColor White
Write-Host "   2. View blockchain integration section" -ForegroundColor White
Write-Host "   3. Test data hashing by making API calls" -ForegroundColor White
Write-Host ""
Write-Host "🔄 To stop all services, run:" -ForegroundColor Cyan
Write-Host "   Stop-Process -Id $($hardhatProcess.Id), $($backendProcess.Id), $($dashboardProcess.Id) -Force" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   - Smart Contract: blockchain/contracts/KryosDataHash.sol" -ForegroundColor White
Write-Host "   - Backend Service: backend/src/services/blockchain.ts" -ForegroundColor White
Write-Host "   - Dashboard Integration: dashboard/src/components/dashboard/overview.tsx" -ForegroundColor White
