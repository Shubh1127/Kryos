#!/bin/bash

# Kryos Blockchain Integration Setup Script
echo "🚀 Setting up Kryos Blockchain Integration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

print_success "Node.js is installed: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_success "npm is installed: $(npm --version)"

# Navigate to blockchain directory
cd blockchain

print_status "Setting up Hardhat project..."

# Install dependencies
print_status "Installing Hardhat and dependencies..."
npm install --save-dev @nomicfoundation/hardhat-toolbox@^5.0.0 ethers --legacy-peer-deps

if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Compile smart contracts
print_status "Compiling smart contracts..."
npx hardhat compile

if [ $? -eq 0 ]; then
    print_success "Smart contracts compiled successfully"
else
    print_error "Failed to compile smart contracts"
    exit 1
fi

# Start local Hardhat network
print_status "Starting local Hardhat network..."
npx hardhat node &
HARDHAT_PID=$!

# Wait for network to start
sleep 5

# Deploy smart contract
print_status "Deploying KryosDataHash contract..."
npx hardhat run scripts/deploy.js --network localhost

if [ $? -eq 0 ]; then
    print_success "Smart contract deployed successfully"
else
    print_error "Failed to deploy smart contract"
    kill $HARDHAT_PID
    exit 1
fi

# Navigate back to backend directory
cd ../backend

# Install backend dependencies
print_status "Installing backend blockchain dependencies..."
npm install ethers crypto-js

if [ $? -eq 0 ]; then
    print_success "Backend dependencies installed successfully"
else
    print_error "Failed to install backend dependencies"
    kill $HARDHAT_PID
    exit 1
fi

# Create environment file
print_status "Creating blockchain environment configuration..."
cat > .env.blockchain << EOF
# Blockchain Configuration
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
BLOCKCHAIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
BLOCKCHAIN_WALLET_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
BLOCKCHAIN_CONTRACT_ADDRESS=$(cat ../blockchain/contract-address.json | grep -o '"address":"[^"]*"' | cut -d'"' -f4)
BLOCKCHAIN_CHAIN_ID=1337
EOF

print_success "Blockchain environment configuration created"

# Start backend server
print_status "Starting backend server..."
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 10

# Navigate to dashboard directory
cd ../dashboard

# Install dashboard dependencies (if needed)
if [ ! -d "node_modules" ]; then
    print_status "Installing dashboard dependencies..."
    npm install
fi

# Start dashboard
print_status "Starting dashboard..."
npm run dev &
DASHBOARD_PID=$!

print_success "🎉 Kryos Blockchain Integration Setup Complete!"
echo ""
echo "📋 Services Running:"
echo "   🔗 Hardhat Network: http://localhost:8545"
echo "   🚀 Backend API: http://localhost:5000"
echo "   📊 Dashboard: http://localhost:3000"
echo ""
echo "📁 Important Files:"
echo "   📄 Smart Contract: blockchain/contracts/KryosDataHash.sol"
echo "   🔧 Contract Address: blockchain/contract-address.json"
echo "   ⚙️  Backend Config: backend/.env.blockchain"
echo ""
echo "🛠️  Next Steps:"
echo "   1. Check the dashboard at http://localhost:3000"
echo "   2. View blockchain integration section"
echo "   3. Test data hashing by making API calls"
echo ""
echo "🔄 To stop all services, run:"
echo "   kill $HARDHAT_PID $BACKEND_PID $DASHBOARD_PID"
echo ""
echo "📚 Documentation:"
echo "   - Smart Contract: blockchain/contracts/KryosDataHash.sol"
echo "   - Backend Service: backend/src/services/blockchain.ts"
echo "   - Dashboard Integration: dashboard/src/components/dashboard/overview.tsx"
