-- SQL script to add PCI DSS framework
-- This can be run directly on the production database

-- Insert PCI DSS framework if it doesn't already exist
INSERT INTO frameworks (id, name, version, description, "isActive", "createdAt")
SELECT 
    '159277a5-c634-47bf-8091-fd8cc01d79fa',
    'PCI DSS',
    'v4.0.1',
    'Payment Card Industry Data Security Standard - A set of security standards designed to ensure that all companies that accept, process, store or transmit credit card information maintain a secure environment.',
    true,
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM frameworks 
    WHERE name = 'PCI DSS' AND version = 'v4.0.1'
);

-- Verify the framework was inserted
SELECT id, name, version, description, "isActive", "createdAt" 
FROM frameworks 
WHERE name = 'PCI DSS' AND version = 'v4.0.1';
