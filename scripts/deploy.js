const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying SEATrax contract to Lisk Sepolia...");
  console.log("Network:", hre.network.name);
  
  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");
  
  if (balance === 0n) {
    console.log("❌ Error: Deployer account has no funds!");
    console.log("Get testnet ETH from: https://sepolia-faucet.lisk.com/");
    process.exit(1);
  }
  
  // Get platform treasury address from env or use deployer
  let platformTreasury = process.env.PLATFORM_TREASURY_ADDRESS || deployer.address;
  // Fallback to deployer if env value is missing or invalid
  try {
    if (!hre.ethers.isAddress(platformTreasury)) {
      console.log("⚠️  Invalid PLATFORM_TREASURY_ADDRESS, falling back to deployer");
      platformTreasury = deployer.address;
    }
  } catch (_) {
    platformTreasury = deployer.address;
  }
  console.log("🏦 Platform Treasury:", platformTreasury);
  
  // Deploy contract
  console.log("\n⏳ Deploying SEATrax contract...");
  const SEATrax = await hre.ethers.getContractFactory("SEATrax");
  
  console.log("Constructor args:", { platformTreasury });
  const seatrax = await SEATrax.deploy(platformTreasury);
  
  console.log("Waiting for deployment transaction...");
  await seatrax.waitForDeployment();
  const contractAddress = await seatrax.getAddress();
  
  console.log("✅ SEATrax deployed to:", contractAddress);
  console.log("🔗 View on BlockScout:", `https://sepolia-blockscout.lisk.com/address/${contractAddress}`);
  
  // Wait for a few block confirmations
  console.log("\n⏳ Waiting for block confirmations...");
  const deployTx = seatrax.deploymentTransaction();
  if (deployTx) {
    await deployTx.wait(5);
    console.log("✅ Confirmed!");
  } else {
    console.log("⚠️  Deployment transaction not available, continuing...");
  }
  
  // Verify contract on BlockScout
  if (process.env.BLOCKSCOUT_API_KEY) {
    console.log("\n⏳ Verifying contract on BlockScout...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [platformTreasury],
      });
      console.log("✅ Contract verified!");
    } catch (error) {
      console.log("⚠️  Verification failed:", error.message);
      console.log("You can verify manually at:", `https://sepolia-blockscout.lisk.com/address/${contractAddress}#code`);
    }
  } else {
    console.log("\n⚠️  BLOCKSCOUT_API_KEY not set, skipping verification");
    console.log("You can verify manually at:", `https://sepolia-blockscout.lisk.com/address/${contractAddress}#code`);
  }
  
  // Update .env.local with contract address
  console.log("\n⏳ Updating .env.local...");
  const envPath = path.join(__dirname, "..", ".env.local");
  
  try {
    let envContent = "";
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf8");
    }
    
    // Update or add contract address
    if (envContent.includes("NEXT_PUBLIC_CONTRACT_ADDRESS=")) {
      envContent = envContent.replace(
        /NEXT_PUBLIC_CONTRACT_ADDRESS=.*/,
        `NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`
      );
    } else {
      envContent += `\nNEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log("✅ Updated .env.local with contract address");
  } catch (error) {
    console.log("⚠️  Could not update .env.local:", error.message);
    console.log("Please manually add to .env.local:");
    console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
  }
  
  // Save deployment info
  const deploymentInfo = {
    network: "lisk-sepolia",
    contractAddress: contractAddress,
    deployer: deployer.address,
    platformTreasury: platformTreasury,
    deployedAt: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
  };
  
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  fs.writeFileSync(
    path.join(deploymentsDir, "lisk-sepolia.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("✅ Deployment info saved to deployments/lisk-sepolia.json");
  
  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("Network:          Lisk Sepolia");
  console.log("Contract Address:", contractAddress);
  console.log("Deployer:        ", deployer.address);
  console.log("Treasury:        ", platformTreasury);
  console.log("BlockScout:      ", `https://sepolia-blockscout.lisk.com/address/${contractAddress}`);
  console.log("=".repeat(60));
  
  console.log("\n✅ Deployment complete!");
  console.log("\n📝 Next steps:");
  console.log("1. Add NEXT_PUBLIC_CONTRACT_ADDRESS to .env.local (if not updated automatically)");
  console.log("2. Grant ADMIN_ROLE to admin addresses using: grantRole(ADMIN_ROLE, adminAddress)");
  console.log("3. Test contract functions on BlockScout or Hardhat");
  console.log("4. Start building frontend features!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
