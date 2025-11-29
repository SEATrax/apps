# Export-Import Shipping Invoice Funding – Smart Contract Instructions for GitHub Copilot

## Project Overview

You are helping build Solidity smart contracts (using Foundry) for a shipping-invoice funding platform.  
Business goal: let **exporters** request short-term loans against shipping invoices, let **investors** invest into curated **pools of invoices**, and let **admins** curate pools and orchestrate cashflows and profit sharing, all secured on-chain.

We represent:
- Each **shipping invoice** as an **NFT** (“Invoice NFT”).
- Each **pool of invoices** as an **NFT** (“Pool NFT”).
No ERC‑20 tokens for now; ownership and accounting are handled via mappings and NFT-linked data.

Roles:
- **Exporter** – submits shipping invoice loans, can withdraw funded amounts, receives final profit share.
- **Investor** – invests in pools, gets pro‑rata return after all invoices in the pool are paid.
- **Admin** – curates invoices into pools, triggers funding distributions and profit sharing, manages configuration.

---

## Business Logic (On-Chain Responsibilities)

### Invoice NFT (shipping invoice)

Exporter submits and finalizes an invoice; at finalization, mint an Invoice NFT with at least:

- `exporterCompany`
- `exporterWallet` (EVM address)
- `importerCompany`
- `shippingDate`
- `shippingAmount`
- `loanAmount`
- `amountInvested` (sum of funds allocated from pools)
- `amountWithdrawn` (sum of exporter withdrawals)
- `status` (e.g. `Pending`, `Finalized`, `Fundraising`, `Funded`, `Paid`, `Cancelled`)
- Link to importer payment reference (ID/hash; actual URL is off‑chain)

Key behaviors:
- Mint on final submit from exporter.
- Update `amountInvested` when pool funds are allocated to this invoice.
- Allow exporter withdrawal only if `amountInvested >= 70% of loanAmount`.
- Track `amountWithdrawn` and prevent withdrawing more than `amountInvested`.
- Mark invoice as `Paid` when off‑chain payment is confirmed (admin/oracle call).

### Pool NFT (curated bundle of invoice NFTs)

Admin curates one or more Invoice NFTs into a pool; mint a Pool NFT with:

- `name`
- `startDate`
- `endDate`
- `invoiceIds[]` (array of Invoice NFT ids in this pool)
- `totalLoanAmount` (sum of `loanAmount` for all invoices in pool)
- `totalShippingAmount` (sum of invoice `shippingAmount` in pool)
- `amountInvested` (total funds invested into this pool)
- `amountDistributed` (total funds sent from pool to invoices)
- `feePaid` (total platform fees actually paid out)
- `status` (`Open`, `Fundraising`, `PartiallyFunded`, `Funded`, `Settling`, `Completed`, etc.)

Investment tracking inside each pool:
- `mapping(address investor => uint256 amountInvestedInPool)`
- Optional: track per‑invoice allocation for audits if needed:
  - `mapping(uint256 invoiceId => uint256 amountAllocatedFromPool)`
  - `mapping(address investor => mapping(uint256 invoiceId => uint256 amountInvestedOnInvoiceViaPool))`

Investor invests into a pool:
- Validate pool status (only `Open`/`Fundraising`).
- Increase `pool.amountInvested` and `pool.investorAmounts[investor]`.
- Keep funds in pool escrow until admin allocates them to invoices.

Admin distributes from pool to invoices:
- Can only allocate funds if:
  - Pool `amountInvested >= 70% of totalLoanAmount` OR pool is fully funded.
- When allocating:
  - Decrease pool free balance, increase `amountDistributed` in pool.
  - Increase target invoice `amountInvested`.
  - Optionally record per‑invoice allocation mappings.
- Allocation is in ETH/value held by the pool contract.

### Withdrawals and Settlement

Exporter withdrawal from invoice:
- Condition: `invoice.amountInvested >= 70% of invoice.loanAmount`.
- Amount to withdraw = min(available, requested).
- Track `amountWithdrawn` and emit event.

Importer payment (off‑chain, but mirrored on-chain):
- Off‑chain system generates a payment URL tied to an invoice (kept off‑chain).
- When importer pays, backend or oracle calls smart contract to mark invoice `Paid`.
- Smart contract updates `status` and emits event.

Profit sharing when pool settles:
- Trigger when **all invoices in a pool are `Paid`**.
- Compute:
  - `totalLoan = pool.totalLoanAmount`
  - `investorReward = 4% of totalLoan`
  - `platformFee = 1% of totalLoan`
  - `exporterShare = totalLoan - investorReward - platformFee`
- Distribute:
  - To investors: proportionally to `pool.investorAmounts[investor] / pool.amountInvested`.
  - To platform: send `platformFee` to a fee wallet.
  - To exporters: distribute `exporterShare` across invoices (e.g., proportional to each invoice `loanAmount`).
- Mark pool status as `Completed` after distribution.

---

## On-Chain vs Off-Chain Data

On-chain (must be modeled in contracts):
- Invoice and Pool NFT existence and ownership.
- All **amount** fields: `loanAmount`, `amountInvested`, `amountWithdrawn`, `amountDistributed`, `feePaid`.
- Pool–invoice relationships (invoice IDs in each pool).
- Investor → pool investment mappings, and (if needed) per‑invoice allocations.
- Status transitions for invoices and pools (`Pending`, `Fundraising`, `Paid`, `Completed`, etc.).
- Financial transfers:
  - Investor → pool
  - Pool → invoice (fund allocation)
  - Invoice → exporter (withdrawals)
  - Profit sharing to investors and exporters
  - Platform fee payout
- Events for every critical change (investment, allocation, withdrawal, payment, profit distribution).

Off-chain (keep in Supabase / Next.js):
- Company profile details beyond what’s strictly needed on-chain.
- Full importer contact data and generated payment URLs.
- Raw invoice documents, shipping docs, KYC, scoring/risk data.
- Admin curation heuristics (why invoices were selected into a pool).
- Analytics, reports, audit logs beyond core financial/accounting events.

---

## Solidity & Architecture Rules

- Use **Solidity ^0.8.x** (current stable).
- Use **Foundry** for building and testing (`forge`).
- Contracts likely needed:
  - `InvoiceNFT.sol` – ERC‑721 + invoice data & logic.
  - `PoolNFT.sol` – ERC‑721 + pool data & logic.
  - `PoolFundingManager.sol` – investments, allocation, profit sharing, and escrow.
  - `AccessControl.sol` – role definitions: Admin, Exporter, Investor.
  - Optional: `PaymentOracle.sol` – trusted component to mark invoices as paid.

- Use **OpenZeppelin** libraries where appropriate:
  - `ERC721`, `AccessControl`, `ReentrancyGuard`, `Ownable` or `AccessControl`.

- **Access control:**
  - Only Admin can:
    - Create pools, add/remove invoice NFTs from pool (initial setup).
    - Allocate funds from pool to invoices.
    - Trigger profit sharing / settlement.
    - Mark invoices as paid (or via authorized oracle).
  - Only Exporter can:
    - Create their own invoice requests (off-chain), finalize and mint invoice NFT.
    - Withdraw from invoices where conditions are met.
  - Only Investor can:
    - Invest into open pools.

- **No ERC‑20 by default**:
  - Do **not** introduce ERC‑20 tokens unless explicitly asked.
  - Use mappings for investor balances instead.

- **Error handling:**
  - Use custom errors (e.g., `error NotAdmin();`, `error PoolNotFundedEnough();`, `error InvoiceNotEligibleForWithdraw();`).
  - Use `require` only for simple checks with concise messages.

- **Events:**
  - Emit events for:
    - `InvoiceMinted`, `InvoiceStatusUpdated`, `InvoiceWithdrawal`.
    - `PoolCreated`, `PoolFunded`, `PoolAllocated`, `PoolSettled`.
    - `Invested`, `ProfitDistributed`, `PlatformFeePaid`.

---

## Testing Rules (Foundry)

- Create one test file per major contract: `InvoiceNFT.t.sol`, `PoolNFT.t.sol`, `PoolFundingManager.t.sol`, `AccessControl.t.sol`, plus one or more **integration** tests simulating the full flow.
- For every public/external function, create tests that cover:
  - Happy path.
  - Access control failures.
  - Edge conditions (0 values, maximum values, boundary ratios like exactly 70%).
  - Reverts for invalid states (e.g., invest in closed pool, withdraw before 70%, settle pool when not all invoices are paid).
- Use Foundry cheatcodes for:
  - Address impersonation (`vm.prank`, `vm.startPrank`).
  - Time manipulation (`vm.warp`).
  - Balance setup (`vm.deal`).
  - Revert expectations (`vm.expectRevert`).
- Add at least one test that goes through the **entire lifecycle**:
  1. Exporter mints invoice.
  2. Admin creates pool with invoices.
  3. Investor invests in pool.
  4. Admin allocates funds from pool to invoices.
  5. Exporter withdraws from invoice.
  6. Admin/oracle marks invoices as paid.
  7. Admin triggers profit sharing; verify all balances.

---

## Style & API Conventions

- Use explicit visibility and return types.
- Prefer small, focused functions.
- Group read-only `view` functions separately from state-changing ones.
- Use `struct` types for invoice and pool data; store only what is needed on-chain.
- Prefer immutable and `constant` for config parameters (e.g., `MIN_FUND_RATIO = 7000` for 70% in basis points, `INVESTOR_REWARD_BP = 400`, `PLATFORM_FEE_BP = 100`).
- Use basis points for percentages to avoid floating-point issues.

---

Use these instructions as the persistent context for generating and updating Solidity contracts and Foundry tests in this repository. Focus on correctness of money flows, clear role separation, and simple, auditable logic.
