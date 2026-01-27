# Payment Flow Documentation

## Overview
The payment system allows Exporters to generate secure payment links for Invoices, which Importers can use to pay via crypto or fiat (future).

## Architecture
- **Table**: `payments` (Supabase)
  - Links `invoice_id` (token ID) to payment metadata.
  - secure public link format: `/pay/[uuid]` (using `invoice_metadata.id`).
- **API**: `/api/payment/create` (Next.js App Router)
- **Frontend**: Exporter Dashboard (`/exporter/invoices/[id]`)

## work Flow

### 1. Generating a Link
When an Exporter clicks **Create Payment Link**:
1.  **Frontend** calls `POST /api/payment/create` with `{ invoiceId }`.
2.  **API** checks `invoice_metadata` for the secure `id` (UUID).
3.  **API** checks if a payment record already exists.
    - If yes: Returns existing link.
    - If no: Creates a new record in `payments` table.
      - `status`: `link_generated`
      - `payment_link`: `/pay/[uuid]`
      - `total_due`: Fetched from `shipping_amount`
4.  **Frontend** receives the link, updates UI state, and opens it.

### 2. Importer Payment
1.  Importer visits `/pay/[uuid]`.
2.  Page fetches invoice details securely using UUID lookup (no sequential ID enumeration).
3.  Importer connects wallet and pays.
4.  Smart Contract `repay()` is called.
5.  Event listener (or manual polling) updates:
    - Blockchain status to `PAID`.
    - DB `payments.status` to `paid`.
    - DB `payments.paid_at` timestamp.

## API Reference

### POST `/api/payment/create`
**Request**:
```json
{
  "invoiceId": 123, // Token ID
  "amount": 50000   // Optional override
}
```

**Response**:
```json
{
  "paymentLink": "http://domain.com/pay/550e8400-e29b-...",
  "isNew": true
}
```
