-- Add missing is_header column to pci_dss_assessments table
ALTER TABLE "pci_dss_assessments" ADD COLUMN IF NOT EXISTS "is_header" boolean DEFAULT false;
