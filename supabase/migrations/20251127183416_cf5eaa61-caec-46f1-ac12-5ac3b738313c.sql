-- Add email_status column to test_attempts table
ALTER TABLE test_attempts 
ADD COLUMN email_status text DEFAULT 'pending' CHECK (email_status IN ('pending', 'sent', 'failed'));