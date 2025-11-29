// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SEATrax
 * @dev Shipping Invoice Funding Platform - MVP Smart Contract
 * 
 * Business Flow:
 * 1. Exporter creates invoice NFT (PENDING)
 * 2. Admin approves/rejects invoice (APPROVED/REJECTED)
 * 3. Admin creates pool with approved invoices (IN_POOL)
 * 4. Investors invest in pool
 * 5. When pool ≥70%: Admin can distribute to invoices (FUNDED)
 * 6. Exporter can withdraw funds (WITHDRAWN)
 * 7. Importer pays invoice (PAID)
 * 8. Admin distributes profits: 4% to investors, 1% platform fee (COMPLETED)
 */
contract SEATrax is ERC721, AccessControl, ReentrancyGuard {
    // ============== ROLES ==============
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // ============== COUNTERS ==============
    uint256 private _invoiceTokenIdCounter;
    uint256 private _poolIdCounter;

    // ============== ENUMS ==============
    enum InvoiceStatus {
        PENDING,      // 0 - Created, awaiting admin approval
        APPROVED,     // 1 - Approved by admin, can be added to pool
        IN_POOL,      // 2 - Added to pool, accepting investments
        FUNDED,       // 3 - Received funds from pool (≥70%)
        WITHDRAWN,    // 4 - Exporter withdrew funds, awaiting payment
        PAID,         // 5 - Importer paid, ready for profit distribution
        COMPLETED,    // 6 - Profits distributed
        REJECTED      // 7 - Rejected by admin
    }

    enum PoolStatus {
        OPEN,         // 0 - Accepting investments
        FUNDED,       // 1 - 100% funded, auto-distributed
        COMPLETED,    // 2 - All profits distributed
        CANCELLED     // 3 - Cancelled by admin
    }

    // ============== STRUCTS ==============
    struct Invoice {
        uint256 tokenId;
        address exporter;
        string exporterCompany;
        string importerCompany;
        string importerEmail;
        uint256 shippingDate;
        uint256 shippingAmount;      // Total shipping value (USD cents)
        uint256 loanAmount;           // Requested loan (USD cents)
        uint256 amountInvested;       // Received from pool (ETH wei)
        uint256 amountWithdrawn;      // Withdrawn by exporter (ETH wei)
        InvoiceStatus status;
        uint256 poolId;               // 0 if not in pool
        string ipfsHash;              // Documents on IPFS
        uint256 createdAt;
    }

    struct Pool {
        uint256 poolId;
        string name;
        uint256 startDate;
        uint256 endDate;
        uint256 totalLoanAmount;      // Sum of invoice loans (USD cents)
        uint256 totalShippingAmount;  // Sum of invoice shipping (USD cents)
        uint256 amountInvested;       // Total ETH invested (wei)
        uint256 amountDistributed;    // Amount sent to invoices (wei)
        uint256 feePaid;              // Platform fee collected (wei)
        PoolStatus status;
        uint256[] invoiceIds;
        uint256 createdAt;
    }

    struct Investment {
        address investor;
        uint256 poolId;
        uint256 amount;               // ETH invested (wei)
        uint256 percentage;           // Basis points (10000 = 100%)
        uint256 timestamp;
        bool returnsClaimed;
    }

    // ============== STORAGE ==============
    mapping(uint256 => Invoice) public invoices;
    mapping(uint256 => Pool) public pools;
    mapping(uint256 => mapping(address => Investment)) public investments;
    mapping(uint256 => address[]) public poolInvestors;
    mapping(address => uint256[]) public exporterInvoices;
    mapping(address => uint256[]) public investorPools;
    mapping(address => bool) public registeredExporters;
    mapping(address => bool) public registeredInvestors;

    // Platform treasury address
    address public platformTreasury;

    // Constants (basis points: 10000 = 100%)
    uint256 public constant INVESTOR_YIELD_BPS = 400;      // 4%
    uint256 public constant PLATFORM_FEE_BPS = 100;        // 1%
    uint256 public constant FUNDING_THRESHOLD_BPS = 7000;  // 70%

    // ============== EVENTS ==============
    event ExporterRegistered(address indexed exporter);
    event InvestorRegistered(address indexed investor);
    event InvoiceCreated(uint256 indexed tokenId, address indexed exporter, uint256 loanAmount);
    event InvoiceApproved(uint256 indexed tokenId, address indexed admin);
    event InvoiceRejected(uint256 indexed tokenId, address indexed admin);
    event PoolCreated(uint256 indexed poolId, string name, uint256 totalLoanAmount);
    event InvestmentMade(uint256 indexed poolId, address indexed investor, uint256 amount);
    event InvoiceFunded(uint256 indexed invoiceId, uint256 amount);
    event FundsWithdrawn(uint256 indexed invoiceId, address indexed exporter, uint256 amount);
    event InvoicePaid(uint256 indexed invoiceId);
    event ProfitsDistributed(uint256 indexed poolId, uint256 investorShare, uint256 platformFee);
    event ReturnsClaimed(uint256 indexed poolId, address indexed investor, uint256 amount);

    // ============== CONSTRUCTOR ==============
    constructor(address _platformTreasury) ERC721("SEATrax Invoice", "STINV") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        platformTreasury = _platformTreasury;
    }

    // ============== MODIFIERS ==============
    modifier onlyExporter() {
        require(registeredExporters[msg.sender], "Not registered as exporter");
        _;
    }

    modifier onlyInvestor() {
        require(registeredInvestors[msg.sender], "Not registered as investor");
        _;
    }

    // ============== EXPORTER FUNCTIONS ==============
    
    function registerExporter() external {
        require(!registeredExporters[msg.sender], "Already registered");
        registeredExporters[msg.sender] = true;
        emit ExporterRegistered(msg.sender);
    }

    function createInvoice(
        string memory _exporterCompany,
        string memory _importerCompany,
        string memory _importerEmail,
        uint256 _shippingDate,
        uint256 _shippingAmount,
        uint256 _loanAmount,
        string memory _ipfsHash
    ) external onlyExporter returns (uint256) {
        require(_loanAmount <= _shippingAmount, "Loan exceeds shipping amount");
        require(_shippingDate > 0, "Invalid shipping date");
        
        _invoiceTokenIdCounter++;
        uint256 newTokenId = _invoiceTokenIdCounter;
        
        _safeMint(msg.sender, newTokenId);
        
        invoices[newTokenId] = Invoice({
            tokenId: newTokenId,
            exporter: msg.sender,
            exporterCompany: _exporterCompany,
            importerCompany: _importerCompany,
            importerEmail: _importerEmail,
            shippingDate: _shippingDate,
            shippingAmount: _shippingAmount,
            loanAmount: _loanAmount,
            amountInvested: 0,
            amountWithdrawn: 0,
            status: InvoiceStatus.PENDING,
            poolId: 0,
            ipfsHash: _ipfsHash,
            createdAt: block.timestamp
        });
        
        exporterInvoices[msg.sender].push(newTokenId);
        
        emit InvoiceCreated(newTokenId, msg.sender, _loanAmount);
        return newTokenId;
    }

    function withdrawFunds(uint256 _invoiceId) external onlyExporter nonReentrant {
        Invoice storage invoice = invoices[_invoiceId];
        require(invoice.exporter == msg.sender, "Not invoice owner");
        require(invoice.status == InvoiceStatus.FUNDED, "Invoice not funded");
        
        (bool canWithdraw, uint256 withdrawableAmount) = _canWithdraw(_invoiceId);
        require(canWithdraw, "Cannot withdraw yet");
        require(withdrawableAmount > 0, "No funds to withdraw");
        
        invoice.amountWithdrawn += withdrawableAmount;
        invoice.status = InvoiceStatus.WITHDRAWN;
        
        (bool success, ) = payable(msg.sender).call{value: withdrawableAmount}("");
        require(success, "Transfer failed");
        
        emit FundsWithdrawn(_invoiceId, msg.sender, withdrawableAmount);
    }

    function getExporterInvoices(address _exporter) external view returns (uint256[] memory) {
        return exporterInvoices[_exporter];
    }

    // ============== INVESTOR FUNCTIONS ==============
    
    function registerInvestor() external {
        require(!registeredInvestors[msg.sender], "Already registered");
        registeredInvestors[msg.sender] = true;
        emit InvestorRegistered(msg.sender);
    }

    function invest(uint256 _poolId) external payable onlyInvestor nonReentrant {
        Pool storage pool = pools[_poolId];
        // Ensure pool exists and is open
        require(pool.createdAt != 0, "Pool not open");
        require(pool.status == PoolStatus.OPEN, "Pool not open");
        require(msg.value > 0, "Investment amount must be > 0");
        require(block.timestamp >= pool.startDate && block.timestamp <= pool.endDate, "Pool not active");
        
        // Record or update investment
        Investment storage investment = investments[_poolId][msg.sender];
        if (investment.amount == 0) {
            poolInvestors[_poolId].push(msg.sender);
            investorPools[msg.sender].push(_poolId);
        }
        
        investment.investor = msg.sender;
        investment.poolId = _poolId;
        investment.amount += msg.value;
        investment.timestamp = block.timestamp;
        
        pool.amountInvested += msg.value;
        
        // Calculate percentage (basis points)
        investment.percentage = (investment.amount * 10000) / pool.amountInvested;
        
        // Recalculate all investor percentages
        _recalculateInvestorPercentages(_poolId);
        
        emit InvestmentMade(_poolId, msg.sender, msg.value);
        
        // Check if pool is 100% funded - auto distribute (exact match)
        if (pool.amountInvested == _calculatePoolTargetAmount(_poolId)) {
            _autoDistributePool(_poolId);
        }
    }

    function claimReturns(uint256 _poolId) external onlyInvestor nonReentrant {
        Pool storage pool = pools[_poolId];
        require(pool.status == PoolStatus.COMPLETED, "Pool not completed");
        
        Investment storage investment = investments[_poolId][msg.sender];
        require(investment.amount > 0, "No investment found");
        require(!investment.returnsClaimed, "Returns already claimed");
        
        // Calculate returns (send yield only to ensure sufficient balance)
        uint256 principalAmount = investment.amount;
        uint256 yieldAmount = (principalAmount * INVESTOR_YIELD_BPS) / 10000;
        uint256 totalReturns = yieldAmount;
        
        investment.returnsClaimed = true;
        
        (bool success, ) = payable(msg.sender).call{value: totalReturns}("");
        require(success, "Transfer failed");
        
        emit ReturnsClaimed(_poolId, msg.sender, totalReturns);
    }

    function getInvestorPools(address _investor) external view returns (uint256[] memory) {
        return investorPools[_investor];
    }

    // ============== ADMIN FUNCTIONS ==============
    
    function verifyExporter(address _exporter) external onlyRole(ADMIN_ROLE) {
        require(registeredExporters[_exporter], "Exporter not registered");
        // In production, add verified mapping
        // For MVP, just emit event - verification tracked in Supabase
    }

    function approveInvoice(uint256 _invoiceId) external onlyRole(ADMIN_ROLE) {
        Invoice storage invoice = invoices[_invoiceId];
        require(invoice.status == InvoiceStatus.PENDING, "Invoice not pending");
        
        invoice.status = InvoiceStatus.APPROVED;
        emit InvoiceApproved(_invoiceId, msg.sender);
    }

    function rejectInvoice(uint256 _invoiceId) external onlyRole(ADMIN_ROLE) {
        Invoice storage invoice = invoices[_invoiceId];
        require(invoice.status == InvoiceStatus.PENDING, "Invoice not pending");
        
        invoice.status = InvoiceStatus.REJECTED;
        emit InvoiceRejected(_invoiceId, msg.sender);
    }

    function createPool(
        string memory _name,
        uint256[] memory _invoiceIds,
        uint256 _startDate,
        uint256 _endDate
    ) external onlyRole(ADMIN_ROLE) returns (uint256) {
        require(_invoiceIds.length > 0, "No invoices selected");
        require(_endDate > _startDate, "Invalid dates");
        
        _poolIdCounter++;
        uint256 newPoolId = _poolIdCounter;
        
        uint256 totalLoan = 0;
        uint256 totalShipping = 0;
        
        // Validate and update invoices
        for (uint256 i = 0; i < _invoiceIds.length; i++) {
            Invoice storage invoice = invoices[_invoiceIds[i]];
            require(invoice.status == InvoiceStatus.APPROVED, "Invoice not approved");
            
            invoice.status = InvoiceStatus.IN_POOL;
            invoice.poolId = newPoolId;
            
            totalLoan += invoice.loanAmount;
            totalShipping += invoice.shippingAmount;
        }
        
        pools[newPoolId] = Pool({
            poolId: newPoolId,
            name: _name,
            startDate: _startDate,
            endDate: _endDate,
            totalLoanAmount: totalLoan,
            totalShippingAmount: totalShipping,
            amountInvested: 0,
            amountDistributed: 0,
            feePaid: 0,
            status: PoolStatus.OPEN,
            invoiceIds: _invoiceIds,
            createdAt: block.timestamp
        });
        
        emit PoolCreated(newPoolId, _name, totalLoan);
        return newPoolId;
    }

    function distributeToInvoice(uint256 _poolId, uint256 _invoiceId, uint256 _amount) 
        external 
        onlyRole(ADMIN_ROLE) 
        nonReentrant 
    {
        Pool storage pool = pools[_poolId];
        Invoice storage invoice = invoices[_invoiceId];
        
        require(invoice.poolId == _poolId, "Invoice not in pool");
        require(invoice.status == InvoiceStatus.IN_POOL, "Invoice not ready");
        require(_amount <= pool.amountInvested - pool.amountDistributed, "Insufficient pool funds");
        
        invoice.amountInvested += _amount;
        invoice.status = InvoiceStatus.FUNDED;
        pool.amountDistributed += _amount;
        
        emit InvoiceFunded(_invoiceId, _amount);
    }

    function markInvoicePaid(uint256 _invoiceId) external onlyRole(ADMIN_ROLE) {
        Invoice storage invoice = invoices[_invoiceId];
        require(invoice.status == InvoiceStatus.WITHDRAWN, "Invoice not withdrawn");
        
        invoice.status = InvoiceStatus.PAID;
        emit InvoicePaid(_invoiceId);
    }

    function distributeProfits(uint256 _poolId) external onlyRole(ADMIN_ROLE) nonReentrant {
        Pool storage pool = pools[_poolId];
        require(pool.status == PoolStatus.FUNDED, "Pool not funded");
        
        // Check all invoices are paid
        for (uint256 i = 0; i < pool.invoiceIds.length; i++) {
            require(invoices[pool.invoiceIds[i]].status == InvoiceStatus.PAID, "Not all invoices paid");
        }
        
        // Calculate profit distribution
        uint256 totalInvested = pool.amountInvested;
        uint256 investorYield = (totalInvested * INVESTOR_YIELD_BPS) / 10000;  // 4%
        uint256 platformFee = (totalInvested * PLATFORM_FEE_BPS) / 10000;      // 1%
        
        // Transfer platform fee
        pool.feePaid = platformFee;
        (bool feeSuccess, ) = payable(platformTreasury).call{value: platformFee}("");
        require(feeSuccess, "Fee transfer failed");
        
        // Mark pool as completed (investors can now claim returns)
        pool.status = PoolStatus.COMPLETED;
        
        // Mark all invoices as completed
        for (uint256 i = 0; i < pool.invoiceIds.length; i++) {
            invoices[pool.invoiceIds[i]].status = InvoiceStatus.COMPLETED;
        }
        
        emit ProfitsDistributed(_poolId, investorYield, platformFee);
    }

    // ============== VIEW FUNCTIONS ==============
    
    function getInvoice(uint256 _invoiceId) external view returns (Invoice memory) {
        return invoices[_invoiceId];
    }

    function getPool(uint256 _poolId) external view returns (Pool memory) {
        return pools[_poolId];
    }

    function getInvestment(uint256 _poolId, address _investor) 
        external 
        view 
        returns (Investment memory) 
    {
        return investments[_poolId][_investor];
    }

    function getPoolInvestors(uint256 _poolId) external view returns (address[] memory) {
        return poolInvestors[_poolId];
    }

    function canWithdraw(uint256 _invoiceId) external view returns (bool, uint256) {
        return _canWithdraw(_invoiceId);
    }

    function getPoolFundingPercentage(uint256 _poolId) external view returns (uint256) {
        Pool memory pool = pools[_poolId];
        if (pool.totalLoanAmount == 0) return 0;
        
        uint256 targetAmount = _calculatePoolTargetAmount(_poolId);
        if (targetAmount == 0) return 0;
        
        return (pool.amountInvested * 10000) / targetAmount;
    }

    function getAllOpenPools() external view returns (uint256[] memory) {
        uint256 count = 0;
        uint256 totalPools = _poolIdCounter;
        
        // Count open pools
        for (uint256 i = 1; i <= totalPools; i++) {
            if (pools[i].status == PoolStatus.OPEN) {
                count++;
            }
        }
        
        // Collect open pool IDs
        uint256[] memory openPools = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= totalPools; i++) {
            if (pools[i].status == PoolStatus.OPEN) {
                openPools[index] = i;
                index++;
            }
        }
        
        return openPools;
    }

    function getAllPendingInvoices() external view returns (uint256[] memory) {
        uint256 count = 0;
        uint256 totalInvoices = _invoiceTokenIdCounter;
        
        for (uint256 i = 1; i <= totalInvoices; i++) {
            if (invoices[i].status == InvoiceStatus.PENDING) {
                count++;
            }
        }
        
        uint256[] memory pendingInvoices = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= totalInvoices; i++) {
            if (invoices[i].status == InvoiceStatus.PENDING) {
                pendingInvoices[index] = i;
                index++;
            }
        }
        
        return pendingInvoices;
    }

    function getAllApprovedInvoices() external view returns (uint256[] memory) {
        uint256 count = 0;
        uint256 totalInvoices = _invoiceTokenIdCounter;
        
        for (uint256 i = 1; i <= totalInvoices; i++) {
            if (invoices[i].status == InvoiceStatus.APPROVED) {
                count++;
            }
        }
        
        uint256[] memory approvedInvoices = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= totalInvoices; i++) {
            if (invoices[i].status == InvoiceStatus.APPROVED) {
                approvedInvoices[index] = i;
                index++;
            }
        }
        
        return approvedInvoices;
    }

    // ============== INTERNAL FUNCTIONS ==============
    
    function _canWithdraw(uint256 _invoiceId) internal view returns (bool, uint256) {
        Invoice memory invoice = invoices[_invoiceId];
        
        if (invoice.status != InvoiceStatus.FUNDED) {
            return (false, 0);
        }
        
        Pool memory pool = pools[invoice.poolId];
        uint256 fundingPercentage = (pool.amountInvested * 10000) / _calculatePoolTargetAmount(invoice.poolId);
        
        // Must be at least 70% funded
        if (fundingPercentage < FUNDING_THRESHOLD_BPS) {
            return (false, 0);
        }
        
        uint256 withdrawableAmount = invoice.amountInvested - invoice.amountWithdrawn;
        return (withdrawableAmount > 0, withdrawableAmount);
    }

    function _calculatePoolTargetAmount(uint256 _poolId) internal view returns (uint256) {
        // For MVP: Target is total loan amount
        // In production, implement USD to ETH conversion
        return pools[_poolId].totalLoanAmount;
    }

    function _recalculateInvestorPercentages(uint256 _poolId) internal {
        address[] memory investors = poolInvestors[_poolId];
        uint256 totalInvested = pools[_poolId].amountInvested;
        
        for (uint256 i = 0; i < investors.length; i++) {
            Investment storage inv = investments[_poolId][investors[i]];
            inv.percentage = (inv.amount * 10000) / totalInvested;
        }
    }

    function _autoDistributePool(uint256 _poolId) internal {
        Pool storage pool = pools[_poolId];
        pool.status = PoolStatus.FUNDED;
        
        // Reserve platform fee (1%) and investor yield (4%) from invested funds
        uint256 platformFeeReserve = (pool.amountInvested * PLATFORM_FEE_BPS) / 10000;
        uint256 investorYieldReserve = (pool.amountInvested * INVESTOR_YIELD_BPS) / 10000;
        uint256 totalReserve = platformFeeReserve + investorYieldReserve;
        // Track reserved funds as distributed so they aren't allocated to invoices
        pool.amountDistributed += totalReserve;
        
        // Distribute remaining funds proportionally to all invoices
        uint256 remainingFunds = pool.amountInvested - pool.amountDistributed;
        
        for (uint256 i = 0; i < pool.invoiceIds.length; i++) {
            uint256 invoiceId = pool.invoiceIds[i];
            Invoice storage invoice = invoices[invoiceId];
            
            if (invoice.status == InvoiceStatus.IN_POOL) {
                // Calculate proportional amount from remaining funds (after fee reserve)
                uint256 invoiceShare = (invoice.loanAmount * remainingFunds) / pool.totalLoanAmount;
                
                invoice.amountInvested = invoiceShare;
                invoice.status = InvoiceStatus.FUNDED;
                pool.amountDistributed += invoiceShare;
                
                // Auto-withdraw to exporter
                invoice.amountWithdrawn = invoiceShare;
                invoice.status = InvoiceStatus.WITHDRAWN;

                (bool success, ) = payable(invoice.exporter).call{value: invoiceShare}("");
                require(success, "Auto-withdraw failed");

                emit InvoiceFunded(invoiceId, invoiceShare);
                emit FundsWithdrawn(invoiceId, invoice.exporter, invoiceShare);
            }
        }
    }

    // ============== ADMIN FUNCTIONS ==============
    
    function updatePlatformTreasury(address _newTreasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newTreasury != address(0), "Invalid address");
        platformTreasury = _newTreasury;
    }

    // Required overrides
    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        override(ERC721, AccessControl) 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }
}
