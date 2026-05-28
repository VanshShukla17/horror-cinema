-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- ============================
-- BOOKINGS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id TEXT NOT NULL,
  movie_title TEXT NOT NULL,
  theater_name TEXT NOT NULL,
  show_date DATE NOT NULL,
  show_time TEXT NOT NULL,
  seats TEXT[] NOT NULL,
  total_price INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================
-- ROW LEVEL SECURITY (RLS)
-- ============================
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Users can only see their own bookings
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own bookings
CREATE POLICY "Users can create own bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================
-- INDEX for faster lookups
-- ============================
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_created_at ON bookings(created_at DESC);
