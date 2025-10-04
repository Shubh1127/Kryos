import { ethers } from 'ethers';
import CryptoJS from 'crypto-js';
import fs from 'fs';
import path from 'path';

interface ContractInfo {
  address: string;
  network: string;
  deployedAt: string;
  abi: any[];
}

interface DataHashInfo {
  externalId: string;
  dataType: string;
  dataHash: string;
  companyId: string;
  timestamp: number;
  storedBy: string;
}

class MockBlockchainService {
  private contractAddress: string;
  private contractABI: any[];
  private mockHashes: Map<string, DataHashInfo> = new Map();
  private totalHashes: number = 0;

  constructor() {
    this.loadContractInfo();
    console.log('🔗 Mock Blockchain service initialized');
  }

  private loadContractInfo() {
    try {
      const contractPath = path.join(__dirname, '../contract-address.json');
      const contractInfo: ContractInfo = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
      this.contractAddress = contractInfo.address;
      this.contractABI = contractInfo.abi;
      console.log('📋 Contract address loaded:', this.contractAddress);
    } catch (error) {
      console.error('❌ Failed to load contract address:', error);
      // Use default values
      this.contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
      this.contractABI = [];
    }
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
   * Store data hash (mock implementation)
   */
  async storeDataHash(
    externalId: string,
    dataType: string,
    data: any,
    companyId: string
  ): Promise<{ txHash: string; blockNumber: number; dataHash: string }> {
    try {
      console.log('🚀 Storing data hash (mock)...');
      console.log('📋 External ID:', externalId);
      console.log('📋 Data Type:', dataType);
      console.log('📋 Company ID:', companyId);

      // Generate hash
      const dataHash = this.generateDataHash(data);
      
      // Mock transaction
      const txHash = '0x' + Math.random().toString(16).substring(2, 66);
      const blockNumber = Math.floor(Math.random() * 1000000) + 1000000;
      
      // Store in mock storage
      const dataHashInfo: DataHashInfo = {
        externalId,
        dataType,
        dataHash,
        companyId,
        timestamp: Math.floor(Date.now() / 1000),
        storedBy: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
      };
      
      this.mockHashes.set(externalId, dataHashInfo);
      this.totalHashes++;

      console.log('✅ Data hash stored (mock):', txHash);
      console.log('📦 Block number:', blockNumber);

      return {
        txHash,
        blockNumber,
        dataHash
      };
    } catch (error) {
      console.error('❌ Failed to store data hash:', error);
      throw new Error(`Mock blockchain transaction failed: ${error.message}`);
    }
  }

  /**
   * Retrieve data hash (mock implementation)
   */
  async getDataHash(externalId: string): Promise<DataHashInfo | null> {
    try {
      console.log('🔍 Retrieving data hash (mock)...');
      console.log('📋 External ID:', externalId);

      const dataHashInfo = this.mockHashes.get(externalId);
      
      if (!dataHashInfo) {
        console.log('❌ Data hash not found');
        return null;
      }

      console.log('✅ Data hash retrieved successfully');
      return dataHashInfo;
    } catch (error) {
      console.error('❌ Failed to retrieve data hash:', error);
      throw new Error(`Failed to retrieve data hash: ${error.message}`);
    }
  }

  /**
   * Check if data hash exists (mock implementation)
   */
  async dataHashExists(externalId: string): Promise<boolean> {
    try {
      const exists = this.mockHashes.has(externalId);
      console.log('🔍 Data hash exists:', exists);
      return exists;
    } catch (error) {
      console.error('❌ Failed to check data hash existence:', error);
      return false;
    }
  }

  /**
   * Get total number of hashes (mock implementation)
   */
  async getTotalHashes(): Promise<number> {
    try {
      console.log('📊 Total hashes stored:', this.totalHashes);
      return this.totalHashes;
    } catch (error) {
      console.error('❌ Failed to get total hashes:', error);
      return 0;
    }
  }

  /**
   * Get data hashes by company ID (mock implementation)
   */
  async getDataHashesByCompany(companyId: string): Promise<{
    externalIds: string[];
    dataTypes: string[];
    dataHashes: string[];
    timestamps: number[];
  }> {
    try {
      console.log('🔍 Retrieving data hashes for company:', companyId);
      
      const companyHashes = Array.from(this.mockHashes.values())
        .filter(hash => hash.companyId === companyId);
      
      return {
        externalIds: companyHashes.map(h => h.externalId),
        dataTypes: companyHashes.map(h => h.dataType),
        dataHashes: companyHashes.map(h => h.dataHash),
        timestamps: companyHashes.map(h => h.timestamp)
      };
    } catch (error) {
      console.error('❌ Failed to get data hashes by company:', error);
      throw new Error(`Failed to get data hashes by company: ${error.message}`);
    }
  }

  /**
   * Get wallet balance (mock implementation)
   */
  async getWalletBalance(): Promise<string> {
    try {
      // Mock balance
      const balance = '10.0';
      return balance;
    } catch (error) {
      console.error('❌ Failed to get wallet balance:', error);
      return '0';
    }
  }

  /**
   * Get network info (mock implementation)
   */
  async getNetworkInfo(): Promise<{
    chainId: number;
    blockNumber: number;
    gasPrice: string;
  }> {
    try {
      return {
        chainId: 1337,
        blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
        gasPrice: '0'
      };
    } catch (error) {
      console.error('❌ Failed to get network info:', error);
      throw new Error(`Failed to get network info: ${error.message}`);
    }
  }
}

export default MockBlockchainService;
