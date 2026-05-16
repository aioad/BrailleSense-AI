/*
  # BrailleSense AI - Core Schema

  1. New Tables
    - `scan_sessions`
      - `id` (uuid, primary key)
      - `detected_text` (text) - the English text decoded from Braille
      - `braille_cells` (jsonb) - array of 6-element binary arrays
      - `confidence` (float) - detection confidence 0-1
      - `frame_metrics` (jsonb) - blur, brightness, angle at time of scan
      - `source` (text) - 'camera', 'upload', or 'manual'
      - `created_at` (timestamptz)
    - `user_preferences`
      - `id` (uuid, primary key)
      - `tts_rate` (float, default 0.9)
      - `tts_pitch` (float, default 1.0)
      - `tts_volume` (float, default 1.0)
      - `haptic_enabled` (boolean, default true)
      - `voice_guidance_enabled` (boolean, default true)
      - `high_contrast` (boolean, default false)
      - `auto_scan` (boolean, default true)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - All tables are publicly readable/writable for this demo
      (in production, would restrict to authenticated users)
*/

CREATE TABLE IF NOT EXISTS scan_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  detected_text text DEFAULT '',
  braille_cells jsonb DEFAULT '[]'::jsonb,
  confidence float DEFAULT 0,
  frame_metrics jsonb DEFAULT '{}'::jsonb,
  source text DEFAULT 'camera' CHECK (source IN ('camera', 'upload', 'manual')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tts_rate float DEFAULT 0.9,
  tts_pitch float DEFAULT 1.0,
  tts_volume float DEFAULT 1.0,
  haptic_enabled boolean DEFAULT true,
  voice_guidance_enabled boolean DEFAULT true,
  high_contrast boolean DEFAULT false,
  auto_scan boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE scan_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on scan_sessions"
  ON scan_sessions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert on scan_sessions"
  ON scan_sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public read on user_preferences"
  ON user_preferences FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert on user_preferences"
  ON user_preferences FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update on user_preferences"
  ON user_preferences FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_scan_sessions_created ON scan_sessions(created_at DESC);
