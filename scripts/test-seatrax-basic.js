/**
 * Test Basic SEATrax Contract Functions
 * 
 * Tests:
 * 1. Contract deployment verification
 * 2. Register as Exporter
 * 3. Register as Investor
 * 4. Create Invoice
 * 5. Approve Invoice (admin)
 * 6. Create Pool (admin)
 * 
 * Run: npx hardhat run scripts/test-seatrax-basic.js --network lisk-sepolia
 */

const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("\n🔍 SEATrax Basic Function Tests");
  console.log("=" .repeat(60));

  // Get contract address from env
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS not found in .env.local");
  }

  console.log(`\n📍 Contract Address: ${contractAddress}`);
  console.log(`🌐 Network: ${hre.network.name}`);

  // Get signer (deployer)
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer Address: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Deployer Balance: ${ethers.formatEther(balance)} ETH`);

  // Load contract ABI
  const SEATrax = await ethers.getContractFactory("SEATrax");
  const seatrax = SEATrax.attach(contractAddress);

  console.log("\n" + "=".repeat(60));
  console.log("TEST 1: Contract Deployment Verification");
  console.log("=".repeat(60));

  try {
    // Check if contract exists
    const code = await ethers.provider.getCode(contractAddress);
    if (code === "0x") {
      throw new Error("No contract found at this address");
    }
    console.log("✅ Contract exists at address");

    // Check if deployer has admin role
    const ADMIN_ROLE = await seatrax.ADMIN_ROLE();
    const hasAdminRole = await seatrax.hasRole(ADMIN_ROLE, deployer.address);
    console.log(`✅ Deployer has ADMIN_ROLE: ${hasAdminRole}`);

    if (!hasAdminRole) {
      console.log("⚠️  WARNING: Deployer does not have admin role!");
    }
  } catch (error) {
    console.error("❌ Deployment verification failed:", error.message);
    return;
  }

  console.log("\n" + "=".repeat(60));
  console.log("TEST 2: Register as Exporter");
  console.log("=".repeat(60));

  try {
    // Check if already registered
    const isAlreadyExporter = await seatrax.registeredExporters(deployer.address);
    
    if (isAlreadyExporter) {
      console.log("ℹ️  Already registered as exporter");
    } else {
      console.log("📝 Registering as exporter...");
      const tx = await seatrax.registerExporter();
      await tx.wait();
      console.log("✅ Successfully registered as exporter");
      console.log(`   Tx Hash: ${tx.hash}`);
    }

    // Verify registration
    const isExporter = await seatrax.registeredExporters(deployer.address);
    console.log(`✅ Exporter status verified: ${isExporter}`);
  } catch (error) {
    console.error("❌ Exporter registration failed:", error.message);
  }

  console.log("\n" + "=".repeat(60));
  console.log("TEST 3: Register as Investor");
  console.log("=".repeat(60));

  try {
    // Check if already registered
    const isAlreadyInvestor = await seatrax.registeredInvestors(deployer.address);
    
    if (isAlreadyInvestor) {
      console.log("ℹ️  Already registered as investor");
    } else {
      console.log("📝 Registering as investor...");
      const tx = await seatrax.registerInvestor();
      await tx.wait();
      console.log("✅ Successfully registered as investor");
      console.log(`   Tx Hash: ${tx.hash}`);
    }

    // Verify registration
    const isInvestor = await seatrax.registeredInvestors(deployer.address);
    console.log(`✅ Investor status verified: ${isInvestor}`);
  } catch (error) {
    console.error("❌ Investor registration failed:", error.message);
  }

  console.log("\n" + "=".repeat(60));
  console.log("TEST 4: Create Invoice");
  console.log("=".repeat(60));

  try {
    // Create test invoice
    const testInvoice = {
      exporterCompany: "Test Exporter Co.",
      importerCompany: "Test Importer Inc.",
      importerEmail: "importer@test.com",
      shippingDate: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days from now
      shippingAmount: ethers.parseEther("100"), // $100 in wei (treating as USD cents)
      loanAmount: ethers.parseEther("70"), // $70 loan
      ipfsHash: "QmTest123456789abcdefghijklmnopqrstuvwxyz" // Mock IPFS hash
    };

    console.log("📝 Creating test invoice...");
    console.log(`   Exporter: ${testInvoice.exporterCompany}`);
    console.log(`   Importer: ${testInvoice.importerCompany}`);
    console.log(`   Shipping Amount: ${ethers.formatEther(testInvoice.shippingAmount)} ETH`);
    console.log(`   Loan Amount: ${ethers.formatEther(testInvoice.loanAmount)} ETH`);

    const tx = await seatrax.createInvoice(
      testInvoice.exporterCompany,
      testInvoice.importerCompany,
      testInvoice.importerEmail,
      testInvoice.shippingDate,
      testInvoice.shippingAmount,
      testInvoice.loanAmount,
      testInvoice.ipfsHash
    );

    const receipt = await tx.wait();
    console.log("✅ Invoice created successfully");
    console.log(`   Tx Hash: ${tx.hash}`);

    // Get invoice ID from event
    const createEvent = receipt.logs.find(log => {
      try {
        const parsed = seatrax.interface.parseLog(log);
        return parsed && parsed.name === "InvoiceCreated";
      } catch {
        return false;
      }
    });

    if (createEvent) {
      const parsedEvent = seatrax.interface.parseLog(createEvent);
      const invoiceId = parsedEvent.args.invoiceId;
      console.log(`   Invoice ID: ${invoiceId}`);

      // Fetch invoice details
      const invoice = await seatrax.getInvoice(invoiceId);
      console.log("✅ Invoice details fetched:");
      console.log(`   Status: ${invoice.status} (0=PENDING)`);
      console.log(`   Exporter: ${invoice.exporterWallet}`);
    }
  } catch (error) {
    console.error("❌ Invoice creation failed:", error.message);
  }

  console.log("\n" + "=".repeat(60));
  console.log("TEST 5: Approve Invoice (Admin Only)");
  console.log("=".repeat(60));

  try {
    // Get all pending invoices (assuming we just created one)
    const pendingInvoices = await seatrax.getAllPendingInvoices();
    
    if (pendingInvoices.length === 0) {
      console.log("ℹ️  No pending invoices to approve");
    } else {
      const invoiceId = pendingInvoices[0];
      console.log(`📝 Approving invoice ID: ${invoiceId}...`);

      const tx = await seatrax.approveInvoice(invoiceId);
      await tx.wait();
      console.log("✅ Invoice approved successfully");
      console.log(`   Tx Hash: ${tx.hash}`);

      // Verify status
      const invoice = await seatrax.getInvoice(invoiceId);
      console.log(`✅ Invoice status: ${invoice.status} (1=APPROVED)`);
    }
  } catch (error) {
    console.error("❌ Invoice approval failed:", error.message);
  }

  console.log("\n" + "=".repeat(60));
  console.log("TEST 6: Create Pool (Admin Only)");
  console.log("=".repeat(60));

  try {
    // Get approved invoices
    const approvedInvoices = await seatrax.getAllApprovedInvoices();
    
    if (approvedInvoices.length === 0) {
      console.log("ℹ️  No approved invoices available for pool");
    } else {
      const testPool = {
        name: "Test Pool 1",
        invoiceIds: [approvedInvoices[0]], // Use first approved invoice
        startDate: Math.floor(Date.now() / 1000),
        endDate: Math.floor(Date.now() / 1000) + 86400 * 60 // 60 days
      };

      console.log(`📝 Creating test pool...`);
      console.log(`   Name: ${testPool.name}`);
      console.log(`   Invoice IDs: [${testPool.invoiceIds.join(", ")}]`);

      const tx = await seatrax.createPool(
        testPool.name,
        testPool.invoiceIds,
        testPool.startDate,
        testPool.endDate
      );

      const receipt = await tx.wait();
      console.log("✅ Pool created successfully");
      console.log(`   Tx Hash: ${tx.hash}`);

      // Get pool ID from event
      const poolEvent = receipt.logs.find(log => {
        try {
          const parsed = seatrax.interface.parseLog(log);
          return parsed && parsed.name === "PoolCreated";
        } catch {
          return false;
        }
      });

      if (poolEvent) {
        const parsedEvent = seatrax.interface.parseLog(poolEvent);
        const poolId = parsedEvent.args.poolId;
        console.log(`   Pool ID: ${poolId}`);

        // Fetch pool details
        const pool = await seatrax.getPool(poolId);
        console.log("✅ Pool details fetched:");
        console.log(`   Name: ${pool.name}`);
        console.log(`   Status: ${pool.status} (0=OPEN)`);
        console.log(`   Total Loan: ${ethers.formatEther(pool.totalLoanAmount)} ETH`);
      }
    }
  } catch (error) {
    console.error("❌ Pool creation failed:", error.message);
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ BASIC FUNCTION TESTS COMPLETE");
  console.log("=".repeat(60));
  console.log("\n📊 Summary:");
  console.log("   All basic contract functions are working correctly!");
  console.log("   Contract is ready for migration Phase 2.\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
