import { ethers } from 'ethers';
import CryptoJS from 'crypto-js';
import fs from 'fs';
import path from 'path';

interface ContractInfo {
  address: string;
  network: string;
  deployedAt: string;
}

interface DataHashInfo {
  externalId: string;
  dataType: string;
  dataHash: string;
  companyId: string;
  timestamp: number;
  storedBy: string;
}

class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;
  private contractAddress: string;
  private contractABI: any[];

  constructor() {
    this.initializeProvider();
    this.loadContractInfo();
    this.initializeContract();
  }

  private initializeProvider() {
    // Use local Hardhat network or Sepolia testnet
    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Initialize wallet with private key
    const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('BLOCKCHAIN_PRIVATE_KEY environment variable is required');
    }
    
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    console.log('🔗 Blockchain provider initialized');
    console.log('👛 Wallet address:', this.wallet.address);
  }

  private loadContractInfo() {
    try {
      const contractPath = path.join(__dirname, '../contract-address.json');
      const contractInfo: ContractInfo = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
      this.contractAddress = contractInfo.address;
      console.log('📋 Contract address loaded:', this.contractAddress);
    } catch (error) {
      console.error('❌ Failed to load contract address:', error);
      throw new Error('Contract address not found. Please deploy the contract first.');
    }
  }

  private initializeContract() {
    // Contract ABI (simplified version)
    this.contractABI = [
      "function storeDataHash(string memory _externalId, string memory _dataType, string memory _dataHash, string memory _companyId) public",
      "function getDataHash(string memory _externalId) public view returns (string memory externalId, string memory dataType, string memory dataHash, string memory companyId, uint256 timestamp, address storedBy)",
      "function dataHashExists(string memory _externalId) public view returns (bool)",
      "function getTotalHashes() public view returns (uint256)",
      "function getDataHashesByCompany(string memory _companyId) public view returns (string[] memory externalIds, string[] memory dataTypes, string[] memory dataHashes, uint256[] memory timestamps)",
      "event DataHashStored(string indexed externalId, string dataType, string dataHash, string companyId, uint256 timestamp, address storedBy)"
    ];

    this.contract = new ethers.Contract(
      this.contractAddress,
      this.contractABI,
      this.wallet
    );

    console.log('📄 Contract initialized');
  }

  /**
   * Generate SHA256 hash of the data
   */
  generateDataHash(data: any): string {
    try {
      // Convert data to string and sort keys for consistent hashing
      const dataString = JSON.stringify(data, Object.keys(data).sort());
      const hash = CryptoJS.SHA256(dataString).toString();
      console.log('🔐 Generated SHA256 hash:', hash.substring(0, 10) + '...');
      return hash;
    } catch (error) {
      console.error('❌ Failed to generate hash:', error);
      throw new Error('Failed to generate data hash');
    }
  }

  /**
   * Store data hash on blockchain
   */
  async storeDataHash(
    externalId: string,
    dataType: string,
    data: any,
    companyId: string
  ): Promise<{ txHash: string; blockNumber: number; dataHash: string }> {
    try {
      console.log('🚀 Storing data hash on blockchain...');
      console.log('📋 External ID:', externalId);
      console.log('📋 Data Type:', dataType);
      console.log('📋 Company ID:', companyId);

      // Generate hash
      const dataHash = this.generateDataHash(data);
      
      // Estimate gas
      const gasEstimate = await this.contract.storeDataHash.estimateGas(
        externalId,
        dataType,
        dataHash,
        companyId
      );

      console.log('⛽ Gas estimate:', gasEstimate.toString());

      // Send transaction
      const tx = await this.contract.storeDataHash(
        externalId,
        dataType,
        dataHash,
        companyId,
        {
          gasLimit: gasEstimate * 120n / 100n // Add 20% buffer
        }
      );

      console.log('📤 Transaction sent:', tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();
      
      console.log('✅ Transaction confirmed!');
      console.log('📦 Block number:', receipt.blockNumber);
      console.log('⛽ Gas used:', receipt.gasUsed.toString());

      return {
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        dataHash
      };
    } catch (error) {
      console.error('❌ Failed to store data hash:', error);
      throw new Error(`Blockchain transaction failed: ${error.message}`);
    }
  }

  /**
   * Retrieve data hash from blockchain
   */
  async getDataHash(externalId: string): Promise<DataHashInfo | null> {
    try {
      console.log('🔍 Retrieving data hash from blockchain...');
      console.log('📋 External ID:', externalId);

      const result = await this.contract.getDataHash(externalId);
      
      // Check if hash exists
      if (!result || result.externalId === '') {
        console.log('❌ Data hash not found');
        return null;
      }

      const dataHashInfo: DataHashInfo = {
        externalId: result.externalId,
        dataType: result.dataType,
        dataHash: result.dataHash,
        companyId: result.companyId,
        timestamp: Number(result.timestamp),
        storedBy: result.storedBy
      };

      console.log('✅ Data hash retrieved successfully');
      return dataHashInfo;
    } catch (error) {
      console.error('❌ Failed to retrieve data hash:', error);
      throw new Error(`Failed to retrieve data hash: ${error.message}`);
    }
  }

  /**
   * Check if data hash exists on blockchain
   */
  async dataHashExists(externalId: string): Promise<boolean> {
    try {
      const exists = await this.contract.dataHashExists(externalId);
      console.log('🔍 Data hash exists:', exists);
      return exists;
    } catch (error) {
      console.error('❌ Failed to check data hash existence:', error);
      return false;
    }
  }

  /**
   * Get total number of hashes stored
   */
  async getTotalHashes(): Promise<number> {
    try {
      const total = await this.contract.getTotalHashes();
      console.log('📊 Total hashes stored:', total.toString());
      return Number(total);
    } catch (error) {
      console.error('❌ Failed to get total hashes:', error);
      return 0;
    }
  }

  /**
   * Get data hashes by company ID
   */
  async getDataHashesByCompany(companyId: string): Promise<{
    externalIds: string[];
    dataTypes: string[];
    dataHashes: string[];
    timestamps: number[];
  }> {
    try {
      console.log('🔍 Retrieving data hashes for company:', companyId);
      
      const result = await this.contract.getDataHashesByCompany(companyId);
      
      return {
        externalIds: result.externalIds,
        dataTypes: result.dataTypes,
        dataHashes: result.dataHashes,
        timestamps: result.timestamps.map((ts: any) => Number(ts))
      };
    } catch (error) {
      console.error('❌ Failed to get data hashes by company:', error);
      throw new Error(`Failed to get data hashes by company: ${error.message}`);
    }
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(): Promise<string> {
    try {
      const balance = await this.provider.getBalance(this.wallet.address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('❌ Failed to get wallet balance:', error);
      return '0';
    }
  }

  /**
   * Get network info
   */
  async getNetworkInfo(): Promise<{
    chainId: number;
    blockNumber: number;
    gasPrice: string;
  }> {
    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      const feeData = await this.provider.getFeeData();
      
      return {
        chainId: Number(network.chainId),
        blockNumber,
        gasPrice: ethers.formatUnits(feeData.gasPrice || 0, 'gwei')
      };
    } catch (error) {
      console.error('❌ Failed to get network info:', error);
      throw new Error(`Failed to get network info: ${error.message}`);
    }
  }
}

export default BlockchainService;
