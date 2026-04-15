-- Run this in the Supabase SQL Editor to create the fallback tables

CREATE TABLE IF NOT EXISTS categories (
  id INT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT,
  type TEXT,
  difficulty TEXT,
  question TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  incorrect_answers JSONB NOT NULL
);

-- Allow public read access to these tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow public read questions" ON questions FOR SELECT USING (true);

-- Enable insert for the seed script (if not using service role key)
CREATE POLICY "Allow anon insert categories" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update categories" ON categories FOR UPDATE USING (true);
CREATE POLICY "Allow anon insert questions" ON questions FOR INSERT WITH CHECK (true);
