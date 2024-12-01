-- Drop existing table if it exists
DROP TABLE IF EXISTS invite_codes;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the invite_codes table with proper UUID types
CREATE TABLE invite_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    used_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON invite_codes
    FOR SELECT USING (true);
    
CREATE POLICY "Enable insert for admins" ON invite_codes
    FOR INSERT WITH CHECK (auth.uid() IN (
        SELECT id FROM users WHERE role IN ('admin', 'owner')
    ));
    
CREATE POLICY "Enable update for admins" ON invite_codes
    FOR UPDATE USING (auth.uid() IN (
        SELECT id FROM users WHERE role IN ('admin', 'owner')
    ));
