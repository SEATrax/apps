-- Add missing columns for invoice details
ALTER TABLE invoice_metadata 
ADD COLUMN IF NOT EXISTS importer_address text,
ADD COLUMN IF NOT EXISTS importer_country text;

-- Backfill data for dummy invoices
UPDATE invoice_metadata SET 
  goods_description = 'Electronics and Gadgets',
  importer_address = '123 Market St, San Francisco, CA 94103',
  importer_country = 'United States'
WHERE token_id = 9001;

UPDATE invoice_metadata SET 
  goods_description = 'Textiles and Fabrics',
  importer_address = '456 Orchard Rd, 238879',
  importer_country = 'Singapore'
WHERE token_id = 9002;

UPDATE invoice_metadata SET 
  goods_description = 'Organic Cocoa Beans',
  importer_address = 'Alexanderplatz 7, 10178 Berlin',
  importer_country = 'Germany'
WHERE token_id = 9003;

UPDATE invoice_metadata SET 
  goods_description = 'Semiconductors Batch A',
  importer_address = '2000 Tech Blvd, Austin, TX 78701',
  importer_country = 'United States'
WHERE token_id = 9004;

UPDATE invoice_metadata SET 
  goods_description = 'Precision Auto Parts',
  importer_address = 'Shinjuku-ku, Tokyo 160-0022',
  importer_country = 'Japan'
WHERE token_id = 9005;

UPDATE invoice_metadata SET 
  goods_description = 'OLED Display Panels',
  importer_address = 'Gangnam-gu, Seoul 06000',
  importer_country = 'South Korea'
WHERE token_id = 9006;

UPDATE invoice_metadata SET 
  goods_description = 'Premium Tea Selection',
  importer_address = '30 St Mary Axe, London EC3A 8BF',
  importer_country = 'United Kingdom'
WHERE token_id = 9007;

UPDATE invoice_metadata SET 
  goods_description = 'Automotive Components',
  importer_address = 'Friedrichstr 10, 10969 Berlin',
  importer_country = 'Germany'
WHERE token_id = 9008;

UPDATE invoice_metadata SET 
  goods_description = 'Leather Handbags',
  importer_address = 'Champs-Élysées, 75008 Paris',
  importer_country = 'France'
WHERE token_id = 9009;

UPDATE invoice_metadata SET 
  goods_description = 'Machinery Parts',
  importer_address = 'George St, Sydney NSW 2000',
  importer_country = 'Australia'
WHERE token_id = 9010;

UPDATE invoice_metadata SET 
  goods_description = 'Smartphones and Tablets',
  importer_address = 'Sheikh Zayed Rd, Dubai',
  importer_country = 'UAE'
WHERE token_id = 9011;

UPDATE invoice_metadata SET 
  goods_description = 'Spices and Herbs',
  importer_address = 'Raffles Place, Singapore 048616',
  importer_country = 'Singapore'
WHERE token_id = 9012;

UPDATE invoice_metadata SET 
  goods_description = 'Legacy Shipment 01',
  importer_address = '100 Industrial Way, Chicago, IL',
  importer_country = 'United States'
WHERE token_id = 9013;

UPDATE invoice_metadata SET 
  goods_description = 'Legacy Shipment 02',
  importer_address = '200 Factory Lane, Manchester',
  importer_country = 'United Kingdom'
WHERE token_id = 9014;
