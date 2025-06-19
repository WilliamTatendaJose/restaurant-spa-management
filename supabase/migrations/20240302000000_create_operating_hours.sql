-- Create operating_hours table
CREATE TABLE IF NOT EXISTS operating_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day TEXT NOT NULL UNIQUE,
  opens_at TIME NOT NULL,
  closes_at TIME NOT NULL,
  is_closed BOOLEAN DEFAULT false,
  day_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_operating_hours_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_operating_hours_updated_at
  BEFORE UPDATE ON operating_hours
  FOR EACH ROW
  EXECUTE FUNCTION update_operating_hours_updated_at();

-- Insert default operating hours
INSERT INTO operating_hours (day, opens_at, closes_at, is_closed, day_order)
VALUES
  ('Monday', '09:00', '18:00', false, 1),
  ('Tuesday', '09:00', '18:00', false, 2),
  ('Wednesday', '09:00', '18:00', false, 3),
  ('Thursday', '09:00', '18:00', false, 4),
  ('Friday', '09:00', '19:00', false, 5),
  ('Saturday', '10:00', '16:00', false, 6),
  ('Sunday', '10:00', '14:00', true, 7)
ON CONFLICT (day) DO NOTHING;