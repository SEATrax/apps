# Exporter Role Implementation Progress

## Feature Verification

| Feature | Status | Implementation Details | Notes |
| :--- | :--- | :--- | :--- |
| **Registration** | ✅ Implemented | `registerExporter`. | Tracks registration in `registeredExporters` mapping. |
| **Create Invoice** | ✅ Implemented | `createInvoice`. | Mints NFT, sets status PENDING. Mints to `msg.sender`. |
| **Withdraw Funds** | ⚠️ Partial | `withdrawFunds`. | **Constraint**: Can only withdraw if status is FUNDED. If pool is <100% (e.g. 75%), status remains IN_POOL until Admin manually calls `distributeToInvoice`. At 100%, `_autoDistributePool` handles this automatically. |
| **View Invoices** | ✅ Implemented | `getExporterInvoices`. | Returns list of Invoice IDs. |

## Action Items
1.  Update documentation to clearly state that withdrawals between 70-99% funding require Admin intervention.
2.  Frontend must handle "Ready for Funding" state vs "Funded" state clearly.
