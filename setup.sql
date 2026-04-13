-- Run this in your Supabase SQL Editor to set up the tables for Quiz Night

CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'waiting', -- waiting, playing, finished
    category TEXT,
    difficulty TEXT,
    questions JSONB,
    current_question INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code TEXT REFERENCES rooms(code) ON DELETE CASCADE,
    name TEXT NOT NULL,
    score INT DEFAULT 0,
    is_host BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    answers JSONB DEFAULT '[]'::jsonb
);

-- Enable RLS (we will allow all for this demo, or just use anon key with public access)
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access (since user isn't using strict Auth)
CREATE POLICY "Allow public read/write on rooms" ON rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on players" ON players FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for rooms and players
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
  ELSE
    ALTER PUBLICATION supabase_realtime ADD TABLE rooms, players;
  END IF;
END $$;
