-- Insert dummy exporter profile if it doesn't exist
INSERT INTO exporters (wallet_address, company_name, tax_id, country, export_license, is_verified)
VALUES (
  '0x6c2c926218f38bca2fce69946113a8acf8300d8b',
  'Global Exporters Ltd (Demo)',
  'TAX-US-998877',
  'United States',
  'EXP-LIC-2026-001',
  true
)
ON CONFLICT (wallet_address) DO UPDATE SET
  company_name = EXCLUDED.company_name;
