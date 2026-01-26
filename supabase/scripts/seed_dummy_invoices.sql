-- Seed Invoice Data for Exporter Dashboard Testing
-- Target Exporter: 0x6C2C926218F38BCA2FCE69946113A8Acf8300D8B (PT Sinar Jaya Export)
-- Note: TokenIDs start at 9000 to avoid conflicts with real contract data

-- Clean up existing dummy data if re-running (optional, safety first)
DELETE FROM invoice_metadata WHERE token_id >= 9000 AND token_id < 10000;

-- 1. PENDING (Waiting for Admin approval)
INSERT INTO invoice_metadata (
    token_id, exporter_wallet, invoice_number, importer_name, 
    status, loan_amount, shipping_amount, created_at, 
    contract_address, transaction_hash
) VALUES 
(9001, '0x6c2c926218f38bca2fce69946113a8acf8300d8b', 'INV-DUMMY-001', 'Global Imports Ltd', 'PENDING', 5000000, 6000000, NOW() - INTERVAL '1 day', '0xMockContract', '0xMockHash1'),
(9002, '0x6c2c926218f38bca2fce69946113a8acf8300d8b', 'INV-DUMMY-002', 'Asia Retailers', 'PENDING', 7500000, 8500000, NOW() - INTERVAL '2 days', '0xMockContract', '0xMockHash2');

-- 2. APPROVED (Ready to be added to Pool)
INSERT INTO invoice_metadata (
    token_id, exporter_wallet, invoice_number, importer_name, 
    status, loan_amount, shipping_amount, created_at,
    contract_address, transaction_hash
) VALUES 
(9003, '0x6c2c926218f38bca2fce69946113a8acf8300d8b', 'INV-DUMMY-003', 'Euro Foods GmbH', 'APPROVED', 12000000, 14000000, NOW() - INTERVAL '3 days', '0xMockContract', '0xMockHash3'),
(9004, '0x6c2c926218f38bca2fce69946113a8acf8300d8b', 'INV-DUMMY-004', 'US Tech Distributors', 'APPROVED', 25000000, 28000000, NOW() - INTERVAL '4 days', '0xMockContract', '0xMockHash4');

-- 3. IN_POOL (Added to a pool, funding in progress)
-- Note: These should ideally link to a pool_metadata, but for invoice list view it might not strict check FK
INSERT INTO invoice_metadata (
    token_id, exporter_wallet, invoice_number, importer_name, 
    status, loan_amount, shipping_amount, pool_id, amount_invested, created_at,
    contract_address, transaction_hash
) VALUES 
(9005, '0x6c2c926218f38bca2fce69946113a8acf8300d8b', 'INV-DUMMY-005', 'Tokyo Trading Co', 'IN_POOL', 10000000, 12000000, 101, 5000000000000000000, NOW() - INTERVAL '5 days', '0xMockContract', '0xMockHash5'),
(9006, '0x6c2c926218f38bca2fce69946113a8acf8300d8b', 'INV-DUMMY-006', 'Seoul Electronics', 'IN_POOL', 15000000, 18000000, 101, 7500000000000000000, NOW() - INTERVAL '6 days', '0xMockContract', '0xMockHash6');

-- 4. FUNDED (Fully funded, ready to withdraw)
-- amount_invested should approx match loan_amount in value (e.g. 1 USD = ~0.0004 ETH)
-- Let's just put some ETH wei amount.
INSERT INTO invoice_metadata (
    token_id, exporter_wallet, invoice_number, importer_name, 
    status, loan_amount, shipping_amount, pool_id, amount_invested, created_at,
    contract_address, transaction_hash
) VALUES 
(9007, '0x6c2c926218f38bca2fce69946113a8acf8300d8b', 'INV-DUMMY-007', 'London Markets', 'FUNDED', 8000000, 9000000, 100, 4000000000000000000, NOW() - INTERVAL '7 days', '0xMockContract', '0xMockHash7'),
(9008, '0x6c2c926218f38bca2fce69946113a8acf8300d8b', 'INV-DUMMY-008', 'Berlin Auto Parts', 'FUNDED', 11000000, 13000000, 100, 5500000000000000000, NOW() - INTERVAL '8 days', '0xMockContract', '0xMockHash8');

-- 5. WITHDRAWN (Funds withdrawn by exporter)
INSERT INTO invoice_metadata (
    token_id, exporter_wallet, invoice_number, importer_name, 
    status, loan_amount, shipping_amount, pool_id, amount_invested, amount_withdrawn, created_at,
    contract_address, transaction_hash
) VALUES 
(9009, '0x6c2c926218f38bca2fce69946113a8acf8300d8b', 'INV-DUMMY-009', 'Paris Luxury Goods', 'WITHDRAWN', 20000000, 25000000, 99, 10000000000000000000, 10000000000000000000, NOW() - INTERVAL '10 days', '0xMockContract', '0xMockHash9'),
(9010, '0x6c2c926218f38bca2fce69946113a8acf8300d8b', 'INV-DUMMY-010', 'Sydney Imports', 'WITHDRAWN', 9000000, 10000000, 99, 4500000000000000000, 4500000000000000000, NOW() - INTERVAL '11 days', '0xMockContract', '0xMockHash10');

-- 6. PAID (Importer paid back)
INSERT INTO invoice_metadata (
    token_id, exporter_wallet, invoice_number, importer_name, 
    status, loan_amount, shipping_amount, pool_id, amount_invested, amount_withdrawn, created_at,
    contract_address, transaction_hash
) VALUES 
(9011, '0x6c2c926218f38bca2fce69946113a8acf8300d8b', 'INV-DUMMY-011', 'Dubai Electronics', 'PAID', 30000000, 35000000, 98, 15000000000000000000, 15000000000000000000, NOW() - INTERVAL '20 days', '0xMockContract', '0xMockHash11'),
(9012, '0x6c2c926218f38bca2fce69946113a8acf8300d8b', 'INV-DUMMY-012', 'Singapore Traders', 'PAID', 15000000, 18000000, 98, 7500000000000000000, 7500000000000000000, NOW() - INTERVAL '21 days', '0xMockContract', '0xMockHash12');

-- 7. COMPLETED (Yield distributed, closed)
INSERT INTO invoice_metadata (
    token_id, exporter_wallet, invoice_number, importer_name, 
    status, loan_amount, shipping_amount, pool_id, amount_invested, amount_withdrawn, created_at,
    contract_address, transaction_hash
) VALUES 
(9013, '0x6c2c926218f38bca2fce69946113a8acf8300d8b', 'INV-DUMMY-013', 'Old Client A', 'COMPLETED', 10000000, 12000000, 90, 5000000000000000000, 5000000000000000000, NOW() - INTERVAL '60 days', '0xMockContract', '0xMockHash13'),
(9014, '0x6c2c926218f38bca2fce69946113a8acf8300d8b', 'INV-DUMMY-014', 'Old Client B', 'COMPLETED', 5000000, 6000000, 90, 2500000000000000000, 2500000000000000000, NOW() - INTERVAL '65 days', '0xMockContract', '0xMockHash14');

