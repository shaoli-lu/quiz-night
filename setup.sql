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

-- Note: We add saved_games and saved_players for game history
CREATE TABLE IF NOT EXISTS saved_games (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code text,
  rounds integer,
  played_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS saved_players (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id uuid REFERENCES saved_games(id) ON DELETE CASCADE,
  player_name text,
  score integer,
  is_winner boolean,
  is_draw boolean
);

CREATE OR REPLACE VIEW scoreboard AS
SELECT 
  player_name as name,
  COUNT(CASE WHEN is_winner = true AND is_draw = false THEN 1 END) as wins,
  COUNT(CASE WHEN is_winner = false THEN 1 END) as losses,
  COUNT(CASE WHEN is_winner = true AND is_draw = true THEN 1 END) as draws,
  MAX(score) as best_score
FROM saved_players
GROUP BY player_name
ORDER BY wins DESC, draws DESC, losses ASC;

-- Enable RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_players ENABLE ROW LEVEL SECURITY;

-- Idempotent Policies
DROP POLICY IF EXISTS "Allow public read/write on rooms" ON rooms;
CREATE POLICY "Allow public read/write on rooms" ON rooms FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read/write on players" ON players;
CREATE POLICY "Allow public read/write on players" ON players FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read/write on saved_games" ON saved_games;
CREATE POLICY "Allow public read/write on saved_games" ON saved_games FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read/write on saved_players" ON saved_players;
CREATE POLICY "Allow public read/write on saved_players" ON saved_players FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for rooms and players
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
  ELSE
    ALTER PUBLICATION supabase_realtime ADD TABLE rooms, players;
  END IF;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;
