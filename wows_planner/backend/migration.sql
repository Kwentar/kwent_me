-- Migration script to update schema for existing databases
-- Run this after init.sql to ensure all columns exist

-- Update Users
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Update Planners
ALTER TABLE planners ADD COLUMN IF NOT EXISTS public_id UUID DEFAULT gen_random_uuid();

-- Add constraint and index for public_id if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'planners_public_id_key') THEN
        ALTER TABLE planners ADD CONSTRAINT planners_public_id_key UNIQUE (public_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_planners_public_id ON planners(public_id);
