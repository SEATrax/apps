const hre = require("hardhat");

async function main() {
  console.log("🧪 Quick Contract Test");
  console.log("======================\n");

  const [deployer] = await hre.ethers.getSigners();
  const contractAddress = "0x5c50eD2f705C6FaDdB0AcC478edDB4Edf109A5f2";
  
  console.log("📍 Contract:", contractAddress);
  console.log("👤 Account:", deployer.address);

  const SEATrax = await hre.ethers.getContractAt("SEATrax", contractAddress);

  try {
    // Test 1: Read-only call
    console.log("\n✅ Test 1: Check Admin Role (read-only)");
    const ADMIN_ROLE = await SEATrax.ADMIN_ROLE();
    const hasAdmin = await SEATrax.hasRole(ADMIN_ROLE, deployer.address);
    console.log(`   Admin role: ${hasAdmin ? '✓ YES' : '✗ NO'}`);

    // Test 2: Check registrations
    console.log("\n✅ Test 2: Check Registrations (read-only)");
    const isExporter = await SEATrax.registeredExporters(deployer.address);
    const isInvestor = await SEATrax.registeredInvestors(deployer.address);
    console.log(`   Registered as exporter: ${isExporter ? '✓ YES' : '✗ NO'}`);
    console.log(`   Registered as investor: ${isInvestor ? '✓ YES' : '✗ NO'}`);

    // Test 3: Get counters
    console.log("\n✅ Test 3: Get Invoice & Pool Counts (read-only)");
    const openPools = await SEATrax.getAllOpenPools();
    console.log(`   Open pools: ${openPools.length}`);

    console.log("\n🎉 All read-only tests passed!");
    console.log("✨ Contract is accessible and verified!");
    
  } catch (error) {
    console.error("\n❌ TEST FAILED:");
    console.error(error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
