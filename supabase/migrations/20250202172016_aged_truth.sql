/*
  # Add email column to ip_logs table

  1. Changes
    - Add `email` column to `ip_logs` table to store login attempt emails
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ip_logs' AND column_name = 'email'
  ) THEN
    ALTER TABLE ip_logs ADD COLUMN email text;
  END IF;
END $$;