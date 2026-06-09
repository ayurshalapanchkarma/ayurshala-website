-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Policy: Public can check if user is admin (for frontend routing)
CREATE POLICY "Anyone can check admin status" ON admins
  FOR SELECT USING (true);

-- Insert Ayurshala admin - requires the user to exist in auth.users
INSERT INTO admins (id, email, full_name)
SELECT id, email, 'Ayurshala Admin'
FROM auth.users
WHERE email = 'ayurshalapanchkarma@gmail.com'
ON CONFLICT (email) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
