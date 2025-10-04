// Blockchain Configuration
export const blockchainConfig = {
  // Local Hardhat network
  rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545',
  privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY || '',
  walletAddress: process.env.BLOCKCHAIN_WALLET_ADDRESS || '',
  contractAddress: process.env.BLOCKCHAIN_CONTRACT_ADDRESS || '',
  
  // Network settings
  chainId: process.env.BLOCKCHAIN_CHAIN_ID || '1337',
  gasLimit: process.env.BLOCKCHAIN_GAS_LIMIT || '1000000',
  
  // Sepolia testnet (optional)
  sepolia: {
    rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    chainId: '11155111'
  }
};

export default blockchainConfig;
