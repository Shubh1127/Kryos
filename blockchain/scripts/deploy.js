const hre = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🚀 Deploying KryosDataHash contract...");

  // Get the contract factory
  const KryosDataHash = await hre.ethers.getContractFactory("KryosDataHash");

  // Deploy the contract
  const kryosDataHash = await KryosDataHash.deploy();

  // Wait for deployment to complete
  await kryosDataHash.waitForDeployment();

  const contractAddress = await kryosDataHash.getAddress();
  
  console.log("✅ KryosDataHash deployed to:", contractAddress);
  console.log("📋 Contract details:");
  console.log("   - Network:", hre.network.name);
  console.log("   - Address:", contractAddress);
  
  // Save contract address to a file for backend use
  const contractInfo = {
    address: contractAddress,
    network: hre.network.name,
    deployedAt: new Date().toISOString()
  };
  
  fs.writeFileSync(
    '../backend/contract-address.json', 
    JSON.stringify(contractInfo, null, 2)
  );
  
  console.log("💾 Contract address saved to backend/contract-address.json");
  
  return contractAddress;
}

// Execute deployment
main()
  .then((address) => {
    console.log("🎉 Deployment completed successfully!");
    console.log("📍 Contract Address:", address);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
