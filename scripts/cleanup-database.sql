-- ============================================
-- SEATrax Database Cleanup Script
-- ============================================
-- WARNING: This will DELETE ALL DATA from all tables
-- Use this to reset database for fresh testing
-- ============================================

-- Disable foreign key checks temporarily (if any)
SET session_replication_role = replica;

-- Clear all data from tables (preserves table structure)
TRUNCATE TABLE payments CASCADE;
TRUNCATE TABLE pool_metadata CASCADE;
TRUNCATE TABLE invoice_metadata CASCADE;
TRUNCATE TABLE investors CASCADE;
TRUNCATE TABLE exporters CASCADE;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Verify cleanup
SELECT 'exporters' as table_name, COUNT(*) as remaining_rows FROM exporters
UNION ALL
SELECT 'investors', COUNT(*) FROM investors
UNION ALL
SELECT 'invoice_metadata', COUNT(*) FROM invoice_metadata
UNION ALL
SELECT 'pool_metadata', COUNT(*) FROM pool_metadata
UNION ALL
SELECT 'payments', COUNT(*) FROM payments;

-- Success message
SELECT '✅ Database cleanup completed!' as status;
