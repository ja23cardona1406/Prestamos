/*
  # Equipment Loan System Schema

  1. New Tables
    - `equipment`
      - `id` (uuid, primary key)
      - `type` (text) - 'laptop' or 'printer'
      - `serial_number` (text, unique)
      - `model` (text)
      - `status` (text) - 'available', 'loaned', 'maintenance', 'lost', 'damaged'
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `loans`
      - `id` (uuid, primary key)
      - `equipment_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `borrower_name` (text)
      - `borrower_department` (text)
      - `start_date` (date)
      - `expected_return_date` (date)
      - `actual_return_date` (date, nullable)
      - `status` (text) - 'active', 'returned', 'delayed', 'lost', 'damaged'
      - `accessories` (text[])
      - `notes` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create equipment table
CREATE TABLE IF NOT EXISTS equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('laptop', 'printer')),
  serial_number text UNIQUE NOT NULL,
  model text NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'loaned', 'maintenance', 'lost', 'damaged')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create loans table
CREATE TABLE IF NOT EXISTS loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid REFERENCES equipment(id) NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  borrower_name text NOT NULL,
  borrower_department text NOT NULL,
  start_date date NOT NULL,
  expected_return_date date NOT NULL,
  actual_return_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'returned', 'delayed', 'lost', 'damaged')),
  accessories text[] DEFAULT '{}',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_dates CHECK (
    start_date <= expected_return_date AND
    (actual_return_date IS NULL OR actual_return_date >= start_date)
  )
);

-- Enable RLS
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

-- Create policies for equipment
CREATE POLICY "Allow authenticated users to view equipment"
  ON equipment
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow super users to manage equipment"
  ON equipment
  USING (
    auth.jwt() ->> 'role' = 'super_user'
  );

-- Create policies for loans
CREATE POLICY "Allow authenticated users to view loans"
  ON loans
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow super users to manage loans"
  ON loans
  USING (
    auth.jwt() ->> 'role' = 'super_user'
  );

-- Create function to update equipment status when loan status changes
CREATE OR REPLACE FUNCTION update_equipment_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE equipment SET status = 'loaned' WHERE id = NEW.equipment_id;
  ELSIF NEW.status IN ('returned', 'lost', 'damaged') THEN
    UPDATE equipment 
    SET status = CASE 
      WHEN NEW.status = 'returned' THEN 'available'
      ELSE NEW.status
    END
    WHERE id = NEW.equipment_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for loan status changes
CREATE TRIGGER loan_status_change
  AFTER INSERT OR UPDATE OF status
  ON loans
  FOR EACH ROW
  EXECUTE FUNCTION update_equipment_status();


  -- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to view equipment" ON equipment;
DROP POLICY IF EXISTS "Allow super users to manage equipment" ON equipment;
DROP POLICY IF EXISTS "Allow authenticated users to view loans" ON loans;
DROP POLICY IF EXISTS "Allow super users to manage loans" ON loans;

-- Drop existing trigger
DROP TRIGGER IF EXISTS loan_status_change ON loans;
DROP FUNCTION IF EXISTS update_equipment_status();

-- Create improved equipment status update function
CREATE OR REPLACE FUNCTION update_equipment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle loan status changes
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
    -- Update equipment status based on loan status
    UPDATE equipment 
    SET 
      status = CASE 
        WHEN NEW.status = 'active' THEN 'loaned'
        WHEN NEW.status = 'returned' THEN 'available'
        WHEN NEW.status IN ('lost', 'damaged') THEN NEW.status
        ELSE status
      END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.equipment_id;
  END IF;

  -- If equipment_id changed in an update, handle old equipment
  IF TG_OP = 'UPDATE' AND OLD.equipment_id != NEW.equipment_id THEN
    -- Set old equipment as available
    UPDATE equipment 
    SET 
      status = 'available',
      updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.equipment_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create improved trigger
CREATE TRIGGER loan_status_change
  AFTER INSERT OR UPDATE OF status, equipment_id
  ON loans
  FOR EACH ROW
  EXECUTE FUNCTION update_equipment_status();

-- Create better RLS policies for equipment
CREATE POLICY "Allow all users to view equipment"
  ON equipment
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow super users to manage equipment"
  ON equipment
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'super_user');

-- Create better RLS policies for loans
CREATE POLICY "Allow users to view all loans"
  ON loans
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow users to create loans"
  ON loans
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'role' = 'super_user' OR
    user_id = auth.uid()
  );

CREATE POLICY "Allow users to update their loans"
  ON loans
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'super_user' OR
    user_id = auth.uid()
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_equipment_id ON loans(equipment_id);

-- Add check constraint for valid date ranges
ALTER TABLE loans DROP CONSTRAINT IF EXISTS valid_dates;
ALTER TABLE loans ADD CONSTRAINT valid_dates 
  CHECK (
    start_date <= expected_return_date AND
    (actual_return_date IS NULL OR actual_return_date >= start_date)
  );