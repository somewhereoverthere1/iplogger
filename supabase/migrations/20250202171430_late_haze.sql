/*
  # Create IP Logs Table

  1. New Tables
    - `ip_logs`
      - `id` (uuid, primary key)
      - `ip` (text, not null)
      - `city` (text)
      - `country` (text)
      - `created_at` (timestamp with time zone)
      - `user_agent` (text)

  2. Security
    - Enable RLS on `ip_logs` table
    - Add policy for inserting new logs
    - Add policy for reading logs
*/

CREATE TABLE IF NOT EXISTS ip_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip text NOT NULL,
  city text,
  country text,
  created_at timestamptz DEFAULT now(),
  user_agent text
);

ALTER TABLE ip_logs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert logs
CREATE POLICY "Anyone can insert ip logs"
  ON ip_logs
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anyone to read logs
CREATE POLICY "Anyone can read ip logs"
  ON ip_logs
  FOR SELECT
  TO anon
  USING (true);