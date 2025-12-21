-- SQL script to remove the 'is_featured' column from the events table
-- This removes the featured functionality from events

-- Step 1: Drop the is_featured column from events table
ALTER TABLE events DROP COLUMN IF EXISTS is_featured;

-- Step 2: (Optional) If you have any indexes on is_featured, drop them first
-- Example: DROP INDEX IF EXISTS idx_events_is_featured;

-- Step 3: (Optional) If you have any views or functions that reference is_featured, update them
-- Example: 
-- CREATE OR REPLACE VIEW events_view AS 
-- SELECT * FROM events;
-- (Remove any WHERE clauses that filter by is_featured)

-- Note: This will permanently remove the is_featured column and all its data
-- Make sure to backup your database before running this script

