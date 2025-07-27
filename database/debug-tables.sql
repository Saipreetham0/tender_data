-- Debug: Check what tables and columns exist
-- Run this in Supabase SQL Editor to see current state

-- Check what tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check columns in user_profiles table (if it exists)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Check if any auth-related tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema IN ('auth', 'public')
AND table_name LIKE '%user%'
ORDER BY table_schema, table_name;