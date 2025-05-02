-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff')),
  department TEXT CHECK (department IN ('spa', 'restaurant', 'both')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all profiles
CREATE POLICY "Users can read all profiles" ON public.user_profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Only admins can insert profiles
CREATE POLICY "Only admins can insert profiles" ON public.user_profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Users can update their own profile
CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (id = auth.uid());

-- Policy: Admins can update any profile
CREATE POLICY "Admins can update any profile" ON public.user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Only admins can delete profiles
CREATE POLICY "Only admins can delete profiles" ON public.user_profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at on user_profiles
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add is_synced column to existing tables
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS is_synced INTEGER DEFAULT 1;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS is_synced INTEGER DEFAULT 1;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS is_synced INTEGER DEFAULT 1;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS is_synced INTEGER DEFAULT 1;
ALTER TABLE public.transaction_items ADD COLUMN IF NOT EXISTS is_synced INTEGER DEFAULT 1;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS is_synced INTEGER DEFAULT 1;

-- Create sync_log table
CREATE TABLE IF NOT EXISTS public.sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  sync_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
