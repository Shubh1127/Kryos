# 🔗 Kryos Blockchain Integration

A comprehensive blockchain integration system that automatically hashes and stores data on the blockchain for transparency and data integrity.

## 🚀 Features

- **SHA256 Data Hashing**: Automatically generates SHA256 hashes for all data entries
- **Smart Contract Storage**: Stores hashes on Ethereum-compatible blockchain
- **Real-time Dashboard**: View blockchain statistics and data integrity
- **Automatic Integration**: Middleware automatically processes all API requests
- **Data Verification**: Verify data integrity using blockchain hashes

## 📋 Prerequisites

- Node.js 18+ (recommended: Node.js 22+)
- npm or yarn
- Git

## 🛠️ Quick Setup

### Option 1: Automated Setup (Recommended)

**For Linux/macOS:**
```bash
chmod +x setup-blockchain.sh
./setup-blockchain.sh
```

**For Windows:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\setup-blockchain.ps1
```

### Option 2: Manual Setup

1. **Setup Hardhat Project**
   ```bash
   cd blockchain
   npm install --save-dev @nomicfoundation/hardhat-toolbox@^5.0.0 ethers --legacy-peer-deps
   npx hardhat compile
   ```

2. **Deploy Smart Contract**
   ```bash
   npx hardhat node &
   npx hardhat run scripts/deploy.js --network localhost
   ```

3. **Setup Backend**
   ```bash
   cd ../backend
   npm install ethers crypto-js
   ```

4. **Configure Environment**
   ```bash
   # Copy contract address from blockchain/contract-address.json
   echo "BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545" >> .env
   echo "BLOCKCHAIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" >> .env
   echo "BLOCKCHAIN_CONTRACT_ADDRESS=<CONTRACT_ADDRESS>" >> .env
   ```

5. **Start Services**
   ```bash
   # Terminal 1: Hardhat Network
   cd blockchain && npx hardhat node
   
   # Terminal 2: Backend
   cd backend && npm run dev
   
   # Terminal 3: Dashboard
   cd dashboard && npm run dev
   ```

## 🏗️ Architecture

### Smart Contract (`KryosDataHash.sol`)
- **Purpose**: Store data hashes on blockchain
- **Features**:
  - Store/retrieve data hashes by external ID
  - Company-based data filtering
  - Event logging for transparency
  - Gas-optimized operations

### Backend Service (`blockchain.ts`)
- **Purpose**: Interface between application and blockchain
- **Features**:
  - SHA256 hash generation
  - Smart contract interaction
  - Error handling and retry logic
  - Network status monitoring

### Middleware (`blockchain.ts`)
- **Purpose**: Automatically process all API requests
- **Features**:
  - Automatic data hashing
  - Blockchain storage
  - Response headers with blockchain info
  - Non-blocking operations

### Dashboard Integration
- **Purpose**: Visualize blockchain data
- **Features**:
  - Real-time blockchain statistics
  - Wallet balance monitoring
  - Network status display
  - Company-specific hash counts

## 📊 API Endpoints

### Blockchain Routes (`/api/blockchain`)

- `GET /stats` - Get blockchain statistics
- `GET /status` - Get network and wallet status
- `GET /hash/:externalId` - Get specific data hash
- `GET /company-hashes` - Get company's data hashes
- `POST /verify` - Verify data integrity

### Example Usage

```javascript
// Get blockchain statistics
const stats = await fetch('/api/blockchain/stats', {
  headers: { 'Authorization': `Bearer ${apiKey}` }
});

// Verify data integrity
const verification = await fetch('/api/blockchain/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    externalId: 'user_123_1640995200000',
    data: { name: 'John Doe', email: 'john@example.com' }
  })
});
```

## 🔧 Configuration

### Environment Variables

```env
# Blockchain Configuration
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
BLOCKCHAIN_PRIVATE_KEY=your-private-key
BLOCKCHAIN_WALLET_ADDRESS=your-wallet-address
BLOCKCHAIN_CONTRACT_ADDRESS=your-contract-address
BLOCKCHAIN_CHAIN_ID=1337
```

### Network Configuration

**Local Development:**
- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `1337`
- Gas Price: `0` (free transactions)

**Sepolia Testnet:**
- RPC URL: `https://sepolia.infura.io/v3/YOUR_INFURA_KEY`
- Chain ID: `11155111`
- Gas Price: Dynamic

## 📈 Data Flow

1. **API Request** → Backend receives data
2. **Data Processing** → Middleware extracts relevant data
3. **Hash Generation** → SHA256 hash of processed data
4. **Blockchain Storage** → Hash stored on smart contract
5. **Response** → API response with blockchain headers
6. **Dashboard Update** → Real-time statistics update

## 🔍 Monitoring

### Dashboard Metrics
- **Total Hashes**: Total number of hashes stored
- **Wallet Balance**: Available ETH for transactions
- **Network Status**: Current blockchain network info
- **Company Hashes**: Number of hashes for your company

### Response Headers
- `X-Blockchain-Hash`: SHA256 hash of the data
- `X-Blockchain-Tx`: Transaction hash
- `X-Blockchain-Block`: Block number
- `X-Blockchain-Total-Hashes`: Total hashes count

## 🛡️ Security Features

- **Data Integrity**: SHA256 hashing ensures data hasn't been tampered with
- **Immutable Storage**: Blockchain provides tamper-proof storage
- **Transparency**: All operations are logged and verifiable
- **Access Control**: Company-based data isolation

## 🚨 Troubleshooting

### Common Issues

1. **"Blockchain service not available"**
   - Check if Hardhat network is running
   - Verify RPC URL configuration
   - Ensure contract is deployed

2. **"Failed to store hash on blockchain"**
   - Check wallet balance (needs ETH for gas)
   - Verify private key configuration
   - Check network connectivity

3. **"Contract address not found"**
   - Deploy smart contract first
   - Check contract-address.json file
   - Verify environment variables

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=blockchain:*
```

## 📚 Smart Contract Methods

### Public Methods
- `storeDataHash(externalId, dataType, dataHash, companyId)` - Store new hash
- `getDataHash(externalId)` - Retrieve hash by ID
- `dataHashExists(externalId)` - Check if hash exists
- `getTotalHashes()` - Get total hash count
- `getDataHashesByCompany(companyId)` - Get company's hashes

### Events
- `DataHashStored` - Emitted when hash is stored
- `DataHashUpdated` - Emitted when hash is updated

## 🔄 Development Workflow

1. **Make API Changes** → Test locally
2. **Deploy Smart Contract** → Update contract address
3. **Update Backend** → Test blockchain integration
4. **Update Dashboard** → Test UI components
5. **Deploy to Production** → Update environment variables

## 📞 Support

For issues or questions:
- Check the troubleshooting section
- Review console logs for errors
- Verify all services are running
- Check network connectivity

## 🎯 Next Steps

- [ ] Add support for multiple blockchain networks
- [ ] Implement data compression for large payloads
- [ ] Add batch operations for multiple hashes
- [ ] Create blockchain explorer integration
- [ ] Add data encryption before hashing
