const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("SEATrax", function () {
  let seatrax;
  let owner, admin, treasury, exporter1, exporter2, investor1, investor2, importer;
  
  const INVOICE_STATUS = {
    PENDING: 0,
    APPROVED: 1,
    IN_POOL: 2,
    FUNDED: 3,
    WITHDRAWN: 4,
    PAID: 5,
    COMPLETED: 6,
    REJECTED: 7
  };
  
  const POOL_STATUS = {
    OPEN: 0,
    FUNDED: 1,
    COMPLETED: 2,
    CANCELLED: 3
  };

  beforeEach(async function () {
    [owner, admin, treasury, exporter1, exporter2, investor1, investor2, importer] = await ethers.getSigners();
    
    const SEATrax = await ethers.getContractFactory("SEATrax");
    seatrax = await SEATrax.deploy(treasury.address);
    await seatrax.waitForDeployment();
    
    // Grant admin role
    const ADMIN_ROLE = await seatrax.ADMIN_ROLE();
    await seatrax.grantRole(ADMIN_ROLE, admin.address);
  });

  describe("Registration", function () {
    it("Should allow exporter registration", async function () {
      await expect(seatrax.connect(exporter1).registerExporter())
        .to.emit(seatrax, "ExporterRegistered")
        .withArgs(exporter1.address);
      
      expect(await seatrax.registeredExporters(exporter1.address)).to.be.true;
    });

    it("Should prevent duplicate exporter registration", async function () {
      await seatrax.connect(exporter1).registerExporter();
      await expect(seatrax.connect(exporter1).registerExporter())
        .to.be.revertedWith("Already registered");
    });

    it("Should allow investor registration", async function () {
      await expect(seatrax.connect(investor1).registerInvestor())
        .to.emit(seatrax, "InvestorRegistered")
        .withArgs(investor1.address);
      
      expect(await seatrax.registeredInvestors(investor1.address)).to.be.true;
    });

    it("Should prevent duplicate investor registration", async function () {
      await seatrax.connect(investor1).registerInvestor();
      await expect(seatrax.connect(investor1).registerInvestor())
        .to.be.revertedWith("Already registered");
    });
  });

  describe("Invoice Creation & Approval", function () {
    beforeEach(async function () {
      await seatrax.connect(exporter1).registerExporter();
    });

    it("Should create invoice with correct data", async function () {
      const shippingDate = Math.floor(Date.now() / 1000);
      const shippingAmount = 10000000; // $100,000 in cents
      const loanAmount = 7000000;      // $70,000 in cents
      
      await expect(seatrax.connect(exporter1).createInvoice(
        "Exporter Co",
        "Importer Co",
        "importer@example.com",
        shippingDate,
        shippingAmount,
        loanAmount,
        "QmHash123"
      )).to.emit(seatrax, "InvoiceCreated");
      
      const invoice = await seatrax.getInvoice(1);
      expect(invoice.exporter).to.equal(exporter1.address);
      expect(invoice.exporterCompany).to.equal("Exporter Co");
      expect(invoice.loanAmount).to.equal(loanAmount);
      expect(invoice.status).to.equal(INVOICE_STATUS.PENDING);
    });

    it("Should reject loan exceeding shipping amount", async function () {
      const shippingDate = Math.floor(Date.now() / 1000);
      await expect(seatrax.connect(exporter1).createInvoice(
        "Exporter Co",
        "Importer Co",
        "importer@example.com",
        shippingDate,
        10000000,
        15000000, // Loan > Shipping
        "QmHash123"
      )).to.be.revertedWith("Loan exceeds shipping amount");
    });

    it("Should allow admin to approve invoice", async function () {
      const shippingDate = Math.floor(Date.now() / 1000);
      await seatrax.connect(exporter1).createInvoice(
        "Exporter Co", "Importer Co", "importer@example.com",
        shippingDate, 10000000, 7000000, "QmHash123"
      );
      
      await expect(seatrax.connect(admin).approveInvoice(1))
        .to.emit(seatrax, "InvoiceApproved")
        .withArgs(1, admin.address);
      
      const invoice = await seatrax.getInvoice(1);
      expect(invoice.status).to.equal(INVOICE_STATUS.APPROVED);
    });

    it("Should allow admin to reject invoice", async function () {
      const shippingDate = Math.floor(Date.now() / 1000);
      await seatrax.connect(exporter1).createInvoice(
        "Exporter Co", "Importer Co", "importer@example.com",
        shippingDate, 10000000, 7000000, "QmHash123"
      );
      
      await expect(seatrax.connect(admin).rejectInvoice(1))
        .to.emit(seatrax, "InvoiceRejected")
        .withArgs(1, admin.address);
      
      const invoice = await seatrax.getInvoice(1);
      expect(invoice.status).to.equal(INVOICE_STATUS.REJECTED);
    });

    it("Should prevent non-admin from approving", async function () {
      const shippingDate = Math.floor(Date.now() / 1000);
      await seatrax.connect(exporter1).createInvoice(
        "Exporter Co", "Importer Co", "importer@example.com",
        shippingDate, 10000000, 7000000, "QmHash123"
      );
      
      await expect(seatrax.connect(exporter1).approveInvoice(1))
        .to.be.reverted;
    });
  });

  describe("Pool Creation", function () {
    beforeEach(async function () {
      await seatrax.connect(exporter1).registerExporter();
      await seatrax.connect(exporter2).registerExporter();
      
      const shippingDate = Math.floor(Date.now() / 1000);
      
      // Create and approve 3 invoices
      await seatrax.connect(exporter1).createInvoice(
        "Exporter1 Co", "Importer1 Co", "importer1@example.com",
        shippingDate, 10000000, 7000000, "QmHash1"
      );
      await seatrax.connect(admin).approveInvoice(1);
      
      await seatrax.connect(exporter1).createInvoice(
        "Exporter1 Co", "Importer2 Co", "importer2@example.com",
        shippingDate, 5000000, 3500000, "QmHash2"
      );
      await seatrax.connect(admin).approveInvoice(2);
      
      await seatrax.connect(exporter2).createInvoice(
        "Exporter2 Co", "Importer3 Co", "importer3@example.com",
        shippingDate, 8000000, 5600000, "QmHash3"
      );
      await seatrax.connect(admin).approveInvoice(3);
    });

    it("Should create pool with multiple invoices", async function () {
      const startDate = await time.latest();
      const endDate = startDate + 30 * 24 * 60 * 60; // 30 days
      
      await expect(seatrax.connect(admin).createPool(
        "Pool Q4 2024",
        [1, 2, 3],
        startDate,
        endDate
      )).to.emit(seatrax, "PoolCreated");
      
      const pool = await seatrax.getPool(1);
      expect(pool.name).to.equal("Pool Q4 2024");
      expect(pool.invoiceIds.length).to.equal(3);
      expect(pool.totalLoanAmount).to.equal(7000000 + 3500000 + 5600000);
      expect(pool.status).to.equal(POOL_STATUS.OPEN);
      
      // Check invoices are now IN_POOL
      const invoice1 = await seatrax.getInvoice(1);
      expect(invoice1.status).to.equal(INVOICE_STATUS.IN_POOL);
      expect(invoice1.poolId).to.equal(1);
    });

    it("Should reject pool with unapproved invoices", async function () {
      const shippingDate = Math.floor(Date.now() / 1000);
      await seatrax.connect(exporter1).createInvoice(
        "Exporter1 Co", "Importer4 Co", "importer4@example.com",
        shippingDate, 5000000, 3500000, "QmHash4"
      );
      // Invoice 4 is PENDING, not approved
      
      const startDate = await time.latest();
      const endDate = startDate + 30 * 24 * 60 * 60;
      
      await expect(seatrax.connect(admin).createPool(
        "Invalid Pool",
        [1, 4],
        startDate,
        endDate
      )).to.be.revertedWith("Invoice not approved");
    });
  });

  describe("Investment Flow", function () {
    let poolId, startDate, endDate;
    
    beforeEach(async function () {
      // Setup exporters and invoices
      await seatrax.connect(exporter1).registerExporter();
      const shippingDate = Math.floor(Date.now() / 1000);
      
      await seatrax.connect(exporter1).createInvoice(
        "Exporter Co", "Importer Co", "importer@example.com",
        shippingDate, 10000000, 7000000, "QmHash1"
      );
      await seatrax.connect(admin).approveInvoice(1);
      
      await seatrax.connect(exporter1).createInvoice(
        "Exporter Co", "Importer2 Co", "importer2@example.com",
        shippingDate, 6000000, 4200000, "QmHash2"
      );
      await seatrax.connect(admin).approveInvoice(2);
      
      // Create pool
      startDate = await time.latest();
      endDate = startDate + 30 * 24 * 60 * 60;
      await seatrax.connect(admin).createPool("Test Pool", [1, 2], startDate, endDate);
      poolId = 1;
      
      // Register investors
      await seatrax.connect(investor1).registerInvestor();
      await seatrax.connect(investor2).registerInvestor();
    });

    it("Should allow investment in open pool", async function () {
      const investAmount = ethers.parseEther("1.0");
      
      await expect(seatrax.connect(investor1).invest(poolId, { value: investAmount }))
        .to.emit(seatrax, "InvestmentMade")
        .withArgs(poolId, investor1.address, investAmount);
      
      const investment = await seatrax.getInvestment(poolId, investor1.address);
      expect(investment.amount).to.equal(investAmount);
      
      const pool = await seatrax.getPool(poolId);
      expect(pool.amountInvested).to.equal(investAmount);
    });

    it("Should track multiple investors with correct percentages", async function () {
      await seatrax.connect(investor1).invest(poolId, { value: ethers.parseEther("7.0") });
      await seatrax.connect(investor2).invest(poolId, { value: ethers.parseEther("3.0") });
      
      const inv1 = await seatrax.getInvestment(poolId, investor1.address);
      const inv2 = await seatrax.getInvestment(poolId, investor2.address);
      
      // investor1: 7/10 = 70% = 7000 basis points
      // investor2: 3/10 = 30% = 3000 basis points
      expect(inv1.percentage).to.equal(7000);
      expect(inv2.percentage).to.equal(3000);
    });

    it("Should prevent investment in non-existent pool", async function () {
      await expect(seatrax.connect(investor1).invest(999, { value: ethers.parseEther("1.0") }))
        .to.be.revertedWith("Pool not open");
    });

    it("Should prevent investment with zero amount", async function () {
      await expect(seatrax.connect(investor1).invest(poolId, { value: 0 }))
        .to.be.revertedWith("Investment amount must be > 0");
    });
  });

  describe("70% Threshold Withdrawal", function () {
    let poolId;
    
    beforeEach(async function () {
      await seatrax.connect(exporter1).registerExporter();
      const shippingDate = Math.floor(Date.now() / 1000);
      
      await seatrax.connect(exporter1).createInvoice(
        "Exporter Co", "Importer Co", "importer@example.com",
        shippingDate, 10000000, 7000000, "QmHash1"
      );
      await seatrax.connect(admin).approveInvoice(1);
      
      const startDate = await time.latest();
      const endDate = startDate + 30 * 24 * 60 * 60;
      await seatrax.connect(admin).createPool("Test Pool", [1], startDate, endDate);
      poolId = 1;
      
      await seatrax.connect(investor1).registerInvestor();
    });

    it("Should allow withdrawal after 70% funding", async function () {
      // Pool target: 7,000,000 (loan amount)
      // 70% = 4,900,000
      const targetAmount = 7000000n;
      const seventyPercent = (targetAmount * 7000n) / 10000n;
      
      // Invest 75% to be above threshold
      const investAmount = (targetAmount * 7500n) / 10000n;
      await seatrax.connect(investor1).invest(poolId, { value: investAmount });
      
      // Admin distributes to invoice
      await seatrax.connect(admin).distributeToInvoice(poolId, 1, investAmount);
      
      // Check canWithdraw
      const [canWithdraw, amount] = await seatrax.canWithdraw(1);
      expect(canWithdraw).to.be.true;
      expect(amount).to.equal(investAmount);
      
      // Withdraw and assert by event + state (avoid balance delta flakiness)
      await expect(seatrax.connect(exporter1).withdrawFunds(1))
        .to.emit(seatrax, "FundsWithdrawn")
        .withArgs(1, exporter1.address, investAmount);

      const invoice = await seatrax.getInvoice(1);
      expect(invoice.status).to.equal(INVOICE_STATUS.WITHDRAWN);
      expect(invoice.amountWithdrawn).to.equal(investAmount);
    });

    it("Should prevent withdrawal below 70% threshold", async function () {
      const targetAmount = 7000000n;
      const sixtyPercent = (targetAmount * 6000n) / 10000n;
      
      await seatrax.connect(investor1).invest(poolId, { value: sixtyPercent });
      await seatrax.connect(admin).distributeToInvoice(poolId, 1, sixtyPercent);
      
      const [canWithdraw, amount] = await seatrax.canWithdraw(1);
      expect(canWithdraw).to.be.false;
      
      await expect(seatrax.connect(exporter1).withdrawFunds(1))
        .to.be.revertedWith("Cannot withdraw yet");
    });
  });

  describe("100% Auto-Distribution", function () {
    let poolId;
    
    beforeEach(async function () {
      await seatrax.connect(exporter1).registerExporter();
      await seatrax.connect(exporter2).registerExporter();
      const shippingDate = Math.floor(Date.now() / 1000);
      
      await seatrax.connect(exporter1).createInvoice(
        "Exporter1 Co", "Importer1 Co", "importer1@example.com",
        shippingDate, 10000000, 6000000, "QmHash1"
      );
      await seatrax.connect(admin).approveInvoice(1);
      
      await seatrax.connect(exporter2).createInvoice(
        "Exporter2 Co", "Importer2 Co", "importer2@example.com",
        shippingDate, 8000000, 4000000, "QmHash2"
      );
      await seatrax.connect(admin).approveInvoice(2);
      
      const startDate = await time.latest();
      const endDate = startDate + 30 * 24 * 60 * 60;
      await seatrax.connect(admin).createPool("Test Pool", [1, 2], startDate, endDate);
      poolId = 1;
      
      await seatrax.connect(investor1).registerInvestor();
    });

    it("Should auto-distribute when pool reaches 100%", async function () {
      const totalLoan = 6000000n + 4000000n; // 10,000,000
      
      const balanceExporter1Before = await ethers.provider.getBalance(exporter1.address);
      const balanceExporter2Before = await ethers.provider.getBalance(exporter2.address);
      
      // Invest exactly 100%
      await seatrax.connect(investor1).invest(poolId, { value: totalLoan });
      
      const balanceExporter1After = await ethers.provider.getBalance(exporter1.address);
      const balanceExporter2After = await ethers.provider.getBalance(exporter2.address);
      
      // Check pool status
      const pool = await seatrax.getPool(poolId);
      expect(pool.status).to.equal(POOL_STATUS.FUNDED);
      
      // Check invoices are withdrawn
      const invoice1 = await seatrax.getInvoice(1);
      const invoice2 = await seatrax.getInvoice(2);
      expect(invoice1.status).to.equal(INVOICE_STATUS.WITHDRAWN);
      expect(invoice2.status).to.equal(INVOICE_STATUS.WITHDRAWN);
      
      // Check exporters received funds proportionally
      expect(balanceExporter1After).to.be.gt(balanceExporter1Before);
      expect(balanceExporter2After).to.be.gt(balanceExporter2Before);
    });
  });

  describe("Profit Distribution", function () {
    let poolId;
    
    beforeEach(async function () {
      await seatrax.connect(exporter1).registerExporter();
      const shippingDate = Math.floor(Date.now() / 1000);
      
      await seatrax.connect(exporter1).createInvoice(
        "Exporter Co", "Importer Co", "importer@example.com",
        shippingDate, 10000000, 10000000, "QmHash1"
      );
      await seatrax.connect(admin).approveInvoice(1);
      
      const startDate = await time.latest();
      const endDate = startDate + 30 * 24 * 60 * 60;
      await seatrax.connect(admin).createPool("Test Pool", [1], startDate, endDate);
      poolId = 1;
      
      await seatrax.connect(investor1).registerInvestor();
      
      // Invest 100% - triggers auto-distribute and withdrawal
      await seatrax.connect(investor1).invest(poolId, { value: 10000000n });
      
      // Mark invoice as paid
      await seatrax.connect(admin).markInvoicePaid(1);
    });

    it("Should distribute profits: 4% to investors, 1% platform fee", async function () {
      const treasuryBalanceBefore = await ethers.provider.getBalance(treasury.address);
      
      await expect(seatrax.connect(admin).distributeProfits(poolId))
        .to.emit(seatrax, "ProfitsDistributed");
      
      const pool = await seatrax.getPool(poolId);
      expect(pool.status).to.equal(POOL_STATUS.COMPLETED);
      
      // Check platform fee (1% of 10,000,000 = 100,000)
      const expectedFee = 100000n;
      expect(pool.feePaid).to.equal(expectedFee);
      
      const treasuryBalanceAfter = await ethers.provider.getBalance(treasury.address);
      expect(treasuryBalanceAfter).to.equal(treasuryBalanceBefore + expectedFee);
      
      // Invoice should be completed
      const invoice = await seatrax.getInvoice(1);
      expect(invoice.status).to.equal(INVOICE_STATUS.COMPLETED);
    });

    it("Should allow investor to claim returns (principal + 4%)", async function () {
      await seatrax.connect(admin).distributeProfits(poolId);
      
      await expect(seatrax.connect(investor1).claimReturns(poolId))
        .to.emit(seatrax, "ReturnsClaimed")
        .withArgs(poolId, investor1.address, 400000n);

      // Check investment is marked as claimed
      const investment = await seatrax.getInvestment(poolId, investor1.address);
      expect(investment.returnsClaimed).to.be.true;
    });

    it("Should prevent double claiming", async function () {
      await seatrax.connect(admin).distributeProfits(poolId);
      await seatrax.connect(investor1).claimReturns(poolId);
      
      await expect(seatrax.connect(investor1).claimReturns(poolId))
        .to.be.revertedWith("Returns already claimed");
    });

    it("Should prevent profit distribution if not all invoices are paid", async function () {
      // Create new pool with unpaid invoice
      await seatrax.connect(exporter1).createInvoice(
        "Exporter Co", "Importer2 Co", "importer2@example.com",
        Math.floor(Date.now() / 1000), 5000000, 5000000, "QmHash2"
      );
      await seatrax.connect(admin).approveInvoice(2);
      
      const startDate = await time.latest();
      const endDate = startDate + 30 * 24 * 60 * 60;
      await seatrax.connect(admin).createPool("Test Pool 2", [2], startDate, endDate);
      
      await seatrax.connect(investor1).invest(2, { value: 5000000n });
      
      // Don't mark as paid
      await expect(seatrax.connect(admin).distributeProfits(2))
        .to.be.revertedWith("Not all invoices paid");
    });
  });

  describe("Access Control", function () {
    it("Should only allow admin to approve invoices", async function () {
      await seatrax.connect(exporter1).registerExporter();
      const shippingDate = Math.floor(Date.now() / 1000);
      await seatrax.connect(exporter1).createInvoice(
        "Exporter Co", "Importer Co", "importer@example.com",
        shippingDate, 10000000, 7000000, "QmHash1"
      );
      
      await expect(seatrax.connect(investor1).approveInvoice(1))
        .to.be.reverted;
    });

    it("Should only allow admin to create pools", async function () {
      await expect(seatrax.connect(exporter1).createPool(
        "Test Pool", [1], Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000) + 86400
      )).to.be.reverted;
    });

    it("Should only allow registered exporters to create invoices", async function () {
      const shippingDate = Math.floor(Date.now() / 1000);
      await expect(seatrax.connect(exporter1).createInvoice(
        "Exporter Co", "Importer Co", "importer@example.com",
        shippingDate, 10000000, 7000000, "QmHash1"
      )).to.be.revertedWith("Not registered as exporter");
    });

    it("Should only allow registered investors to invest", async function () {
      await expect(seatrax.connect(investor1).invest(1, { value: ethers.parseEther("1.0") }))
        .to.be.revertedWith("Not registered as investor");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await seatrax.connect(exporter1).registerExporter();
      const shippingDate = Math.floor(Date.now() / 1000);
      
      await seatrax.connect(exporter1).createInvoice(
        "Exporter Co", "Importer1 Co", "importer1@example.com",
        shippingDate, 10000000, 7000000, "QmHash1"
      );
      await seatrax.connect(exporter1).createInvoice(
        "Exporter Co", "Importer2 Co", "importer2@example.com",
        shippingDate, 5000000, 3500000, "QmHash2"
      );
    });

    it("Should return exporter invoices", async function () {
      const invoices = await seatrax.getExporterInvoices(exporter1.address);
      expect(invoices.length).to.equal(2);
      expect(invoices[0]).to.equal(1);
      expect(invoices[1]).to.equal(2);
    });

    it("Should return all pending invoices", async function () {
      const pending = await seatrax.getAllPendingInvoices();
      expect(pending.length).to.equal(2);
    });

    it("Should return all approved invoices", async function () {
      await seatrax.connect(admin).approveInvoice(1);
      const approved = await seatrax.getAllApprovedInvoices();
      expect(approved.length).to.equal(1);
      expect(approved[0]).to.equal(1);
    });

    it("Should return all open pools", async function () {
      await seatrax.connect(admin).approveInvoice(1);
      await seatrax.connect(admin).approveInvoice(2);
      
      const startDate = await time.latest();
      const endDate = startDate + 30 * 24 * 60 * 60;
      await seatrax.connect(admin).createPool("Pool 1", [1], startDate, endDate);
      await seatrax.connect(admin).createPool("Pool 2", [2], startDate, endDate);
      
      const openPools = await seatrax.getAllOpenPools();
      expect(openPools.length).to.equal(2);
    });

    it("Should calculate pool funding percentage", async function () {
      await seatrax.connect(admin).approveInvoice(1);
      const startDate = await time.latest();
      const endDate = startDate + 30 * 24 * 60 * 60;
      await seatrax.connect(admin).createPool("Test Pool", [1], startDate, endDate);
      
      await seatrax.connect(investor1).registerInvestor();
      await seatrax.connect(investor1).invest(1, { value: 3500000n }); // 50% of 7,000,000
      
      const percentage = await seatrax.getPoolFundingPercentage(1);
      expect(percentage).to.equal(5000); // 50% = 5000 basis points
    });
  });
});
