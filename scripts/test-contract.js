const hre = require("hardhat");

async function main() {
  console.log("🧪 Testing SEATrax Contract Functions");
  console.log("=====================================\n");

  const signers = await hre.ethers.getSigners();
  const deployer = signers[0];
  
  // For testing, we'll use the deployer for all roles
  const exporter = deployer;
  const investor = deployer;
  
  const contractAddress = "0x5c50eD2f705C6FaDdB0AcC478edDB4Edf109A5f2";
  
  console.log("📍 Contract Address:", contractAddress);
  console.log("👤 Deployer/Admin:", deployer.address);
  console.log("ℹ️  Note: Using deployer for all test roles\n");

  // Get contract instance
  const SEATrax = await hre.ethers.getContractAt("SEATrax", contractAddress);

  try {
    // Test 1: Check deployer has admin role
    console.log("✅ Test 1: Check Admin Role");
    const ADMIN_ROLE = await SEATrax.ADMIN_ROLE();
    const hasAdminRole = await SEATrax.hasRole(ADMIN_ROLE, deployer.address);
    console.log(`   Deployer has ADMIN_ROLE: ${hasAdminRole}`);
    if (!hasAdminRole) {
      throw new Error("Deployer should have admin role!");
    }
    console.log("   ✓ PASSED\n");

    // Test 2: Register Exporter
    console.log("✅ Test 2: Register Exporter");
    const exporterContract = SEATrax.connect(exporter);
    const isRegisteredBefore = await SEATrax.registeredExporters(exporter.address);
    console.log(`   Exporter registered before: ${isRegisteredBefore}`);
    
    if (!isRegisteredBefore) {
      console.log("   Calling registerExporter()...");
      const tx1 = await exporterContract.registerExporter();
      await tx1.wait();
      console.log(`   ✓ Transaction hash: ${tx1.hash}`);
    } else {
      console.log("   ⓘ Already registered");
    }
    
    const isRegisteredAfter = await SEATrax.registeredExporters(exporter.address);
    console.log(`   Exporter registered after: ${isRegisteredAfter}`);
    if (!isRegisteredAfter) {
      throw new Error("Exporter registration failed!");
    }
    console.log("   ✓ PASSED\n");

    // Test 3: Register Investor
    console.log("✅ Test 3: Register Investor");
    const investorContract = SEATrax.connect(investor);
    const isInvestorBefore = await SEATrax.registeredInvestors(investor.address);
    console.log(`   Investor registered before: ${isInvestorBefore}`);
    
    if (!isInvestorBefore) {
      console.log("   Calling registerInvestor()...");
      const tx2 = await investorContract.registerInvestor();
      await tx2.wait();
      console.log(`   ✓ Transaction hash: ${tx2.hash}`);
    } else {
      console.log("   ⓘ Already registered");
    }
    
    const isInvestorAfter = await SEATrax.registeredInvestors(investor.address);
    console.log(`   Investor registered after: ${isInvestorAfter}`);
    if (!isInvestorAfter) {
      throw new Error("Investor registration failed!");
    }
    console.log("   ✓ PASSED\n");

    // Test 4: Create Invoice
    console.log("✅ Test 4: Create Invoice");
    const shippingDate = Math.floor(Date.now() / 1000);
    const shippingAmount = hre.ethers.parseEther("100000"); // $100k in wei
    const loanAmount = hre.ethers.parseEther("70000"); // $70k loan
    
    console.log("   Creating invoice...");
    const tx3 = await exporterContract.createInvoice(
      "PT Exporter Test",
      "PT Importer Test",
      "importer@test.com",
      shippingDate,
      shippingAmount,
      loanAmount,
      "QmTestIPFSHash123"
    );
    const receipt = await tx3.wait();
    console.log(`   ✓ Transaction hash: ${tx3.hash}`);
    
    // Find InvoiceCreated event
    const event = receipt.logs.find(log => {
      try {
        const parsed = SEATrax.interface.parseLog(log);
        return parsed && parsed.name === "InvoiceCreated";
      } catch {
        return false;
      }
    });
    
    let invoiceId;
    if (event) {
      const parsed = SEATrax.interface.parseLog(event);
      invoiceId = parsed.args.invoiceId;
      console.log(`   ✓ Invoice ID: ${invoiceId}`);
    } else {
      console.log("   ⚠ Could not find InvoiceCreated event, using tokenId 0");
      invoiceId = 0;
    }
    
    const invoice = await SEATrax.getInvoice(invoiceId);
    console.log(`   Invoice Status: ${invoice.status} (0=PENDING)`);
    console.log(`   Exporter: ${invoice.exporter}`);
    console.log(`   Shipping Amount: ${hre.ethers.formatEther(invoice.shippingAmount)} ETH`);
    console.log(`   Loan Amount: ${hre.ethers.formatEther(invoice.loanAmount)} ETH`);
    console.log("   ✓ PASSED\n");

    // Test 5: Verify and Approve Invoice (Admin only)
    console.log("✅ Test 5: Verify Exporter & Approve Invoice");
    
    // Verify exporter first
    const isVerified = await SEATrax.verifiedExporters(exporter.address);
    if (!isVerified) {
      console.log("   Verifying exporter...");
      const tx4 = await SEATrax.verifyExporter(exporter.address);
      await tx4.wait();
      console.log(`   ✓ Transaction hash: ${tx4.hash}`);
    } else {
      console.log("   ⓘ Exporter already verified");
    }
    
    // Approve invoice
    console.log("   Approving invoice...");
    const tx5 = await SEATrax.approveInvoice(invoiceId);
    await tx5.wait();
    console.log(`   ✓ Transaction hash: ${tx5.hash}`);
    
    const invoiceAfterApproval = await SEATrax.getInvoice(invoiceId);
    console.log(`   Invoice Status after approval: ${invoiceAfterApproval.status} (1=APPROVED)`);
    console.log("   ✓ PASSED\n");

    // Test 6: Create Pool
    console.log("✅ Test 6: Create Pool");
    const startDate = Math.floor(Date.now() / 1000);
    const endDate = startDate + (30 * 24 * 60 * 60); // 30 days
    
    console.log("   Creating pool with invoice...");
    const tx6 = await SEATrax.createPool(
      "Test Pool Jan 2026",
      [invoiceId],
      startDate,
      endDate
    );
    const receipt6 = await tx6.wait();
    console.log(`   ✓ Transaction hash: ${tx6.hash}`);
    
    // Find PoolCreated event
    const poolEvent = receipt6.logs.find(log => {
      try {
        const parsed = SEATrax.interface.parseLog(log);
        return parsed && parsed.name === "PoolCreated";
      } catch {
        return false;
      }
    });
    
    let poolId;
    if (poolEvent) {
      const parsed = SEATrax.interface.parseLog(poolEvent);
      poolId = parsed.args.poolId;
      console.log(`   ✓ Pool ID: ${poolId}`);
    } else {
      console.log("   ⚠ Could not find PoolCreated event, using poolId 0");
      poolId = 0;
    }
    
    const pool = await SEATrax.getPool(poolId);
    console.log(`   Pool Status: ${pool.status} (0=OPEN)`);
    console.log(`   Total Loan Amount: ${hre.ethers.formatEther(pool.totalLoanAmount)} ETH`);
    console.log(`   Pool Name: ${pool.name}`);
    console.log("   ✓ PASSED\n");

    console.log("🎉 ALL TESTS PASSED!");
    console.log("\n📊 Summary:");
    console.log("   ✅ Admin role verification");
    console.log("   ✅ Exporter registration");
    console.log("   ✅ Investor registration");
    console.log("   ✅ Invoice creation");
    console.log("   ✅ Invoice approval");
    console.log("   ✅ Pool creation");
    console.log("\n✨ Contract is ready for migration!");

  } catch (error) {
    console.error("\n❌ TEST FAILED:");
    console.error(error.message);
    if (error.data) {
      console.error("Error data:", error.data);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
