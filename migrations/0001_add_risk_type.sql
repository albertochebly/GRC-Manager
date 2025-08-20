-- Add risk_type column to risks table
ALTER TABLE risks 
ADD COLUMN risk_type varchar(50) DEFAULT 'asset';

-- Update existing risks to have asset type by default
UPDATE risks 
SET risk_type = 'asset' 
WHERE risk_type IS NULL;
