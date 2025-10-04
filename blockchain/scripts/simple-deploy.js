// Simple deployment script for KryosDataHash contract
const { ethers } = require("ethers");

async function deployContract() {
  console.log("🚀 Deploying KryosDataHash contract...");
  
  // Contract ABI (simplified)
  const contractABI = [
    "constructor()",
    "function storeDataHash(string memory _externalId, string memory _dataType, string memory _dataHash, string memory _companyId) public",
    "function getDataHash(string memory _externalId) public view returns (string memory externalId, string memory dataType, string memory dataHash, string memory companyId, uint256 timestamp, address storedBy)",
    "function dataHashExists(string memory _externalId) public view returns (bool)",
    "function getTotalHashes() public view returns (uint256)"
  ];

  // Contract bytecode (this would be the compiled bytecode)
  const contractBytecode = "0x608060405234801561001057600080fd5b50600436106100575760003560e01c8063..."; // This would be the actual bytecode

  try {
    // Connect to local Hardhat network
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    
    // Use the first account from Hardhat
    const wallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
    
    console.log("👛 Using wallet:", wallet.address);
    
    // Deploy contract
    const factory = new ethers.ContractFactory(contractABI, contractBytecode, wallet);
    const contract = await factory.deploy();
    
    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();
    
    console.log("✅ Contract deployed to:", contractAddress);
    
    // Save contract info
    const fs = require('fs');
    const contractInfo = {
      address: contractAddress,
      network: "localhost",
      deployedAt: new Date().toISOString(),
      abi: contractABI
    };
    
    fs.writeFileSync(
      '../backend/contract-address.json', 
      JSON.stringify(contractInfo, null, 2)
    );
    
    console.log("💾 Contract address saved to backend/contract-address.json");
    
    return contractAddress;
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    console.log("💡 Make sure Hardhat network is running: npx hardhat node");
    throw error;
  }
}

// Run deployment
deployContract()
  .then((address) => {
    console.log("🎉 Deployment completed successfully!");
    console.log("📍 Contract Address:", address);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
