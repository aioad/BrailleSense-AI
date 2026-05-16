import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ScanSession = {
  id: string;
  detected_text: string;
  braille_cells: number[][];
  confidence: number;
  frame_metrics: {
    blur?: number;
    brightness?: number;
    angle?: number;
  };
  source: 'camera' | 'upload' | 'manual';
  created_at: string;
};

export type UserPreferences = {
  id: string;
  tts_rate: number;
  tts_pitch: number;
  tts_volume: number;
  haptic_enabled: boolean;
  voice_guidance_enabled: boolean;
  high_contrast: boolean;
  auto_scan: boolean;
  created_at: string;
  updated_at: string;
};

export async function saveScanSession(session: Omit<ScanSession, 'id' | 'created_at'>): Promise<ScanSession | null> {
  const { data, error } = await supabase
    .from('scan_sessions')
    .insert(session)
    .select()
    .maybeSingle();
  if (error) { console.error('Save scan error:', error); return null; }
  return data;
}

export async function getScanHistory(limit = 50): Promise<ScanSession[]> {
  const { data, error } = await supabase
    .from('scan_sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) { console.error('Get history error:', error); return []; }
  return data ?? [];
}

export async function deleteScanSession(id: string): Promise<boolean> {
  const { error } = await supabase.from('scan_sessions').delete().eq('id', id);
  return !error;
}

export async function getPreferences(): Promise<UserPreferences | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .limit(1)
    .maybeSingle();
  if (error) { console.error('Get prefs error:', error); return null; }
  return data;
}

export async function savePreferences(prefs: Partial<Omit<UserPreferences, 'id' | 'created_at' | 'updated_at'>>): Promise<UserPreferences | null> {
  const existing = await getPreferences();

  if (existing) {
    const { data, error } = await supabase
      .from('user_preferences')
      .update({ ...prefs, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .maybeSingle();
    if (error) { console.error('Update prefs error:', error); return null; }
    return data;
  }

  const { data, error } = await supabase
    .from('user_preferences')
    .insert(prefs)
    .select()
    .maybeSingle();
  if (error) { console.error('Insert prefs error:', error); return null; }
  return data;
}
