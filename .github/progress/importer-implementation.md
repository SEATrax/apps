# Importer Role Implementation Progress

## Feature Verification

| Feature | Status | Implementation Details | Notes |
| :--- | :--- | :--- | :--- |
| **Payment Interface** | ❌ Missing on-chain | No direct Importer interaction in contract. | Expected for this architecture (payment is off-chain/fiat). |
| **Payment Oracle** | ✅ Manual | Admin manually calls `markInvoicePaid`. | Automated Oracle skipped for MVP. Admin confirms fiat payment receipt and updates chain. |
| **Notifications** | ℹ️ Off-chain | `importerEmail` stored in Struct. | Backend can trigger emails based on Supabase `invoice_metadata` events. |

## Action Items
1.  Decide if Oracle contract is needed for MVP or if Admin manual confirmation is sufficient.
2.  If Oracle is dropped, update business documentation to reflect "Admin Confirmed Payment" flow.
