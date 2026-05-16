import { useEffect, useState, useCallback } from 'react';
import { Settings as SettingsIcon, Volume2, Vibrate, Eye, MonitorSpeaker, Save, CheckCircle, Loader2 } from 'lucide-react';
import { getPreferences, savePreferences, type UserPreferences } from '../lib/supabase';

const DEFAULT_PREFS: Omit<UserPreferences, 'id' | 'created_at' | 'updated_at'> = {
  tts_rate: 0.9,
  tts_pitch: 1.0,
  tts_volume: 1.0,
  haptic_enabled: true,
  voice_guidance_enabled: true,
  high_contrast: false,
  auto_scan: true,
};

export default function Settings() {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await getPreferences();
      if (data) {
        setPrefs({
          tts_rate: data.tts_rate,
          tts_pitch: data.tts_pitch,
          tts_volume: data.tts_volume,
          haptic_enabled: data.haptic_enabled,
          voice_guidance_enabled: data.voice_guidance_enabled,
          high_contrast: data.high_contrast,
          auto_scan: data.auto_scan,
        });
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaved(false);
    const ok = await savePreferences(prefs);
    setSaving(false);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }, [prefs]);

  const update = <K extends keyof typeof prefs>(key: K, value: (typeof prefs)[K]) => {
    setPrefs(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  if (loading) {
    return (
      <section id="settings" className="py-24 bg-gray-900" aria-label="Settings">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
        </div>
      </section>
    );
  }

  return (
    <section id="settings" className="py-24 bg-gray-900" aria-label="Settings">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-xs font-semibold uppercase tracking-widest mb-4">
            <SettingsIcon className="w-3.5 h-3.5" />
            Settings
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Preferences</h2>
          <p className="text-gray-400 text-lg">Customize your BrailleSense experience.</p>
        </div>

        <div className="space-y-4">
          {/* TTS Settings */}
          <div className="bg-gray-950 rounded-2xl border border-white/10 p-6">
            <div className="flex items-center gap-2 mb-5">
              <Volume2 className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-white">Voice Output</h3>
            </div>
            <div className="space-y-5">
              <SliderSetting
                label="Speech Rate"
                value={prefs.tts_rate}
                min={0.3} max={2} step={0.1}
                format={v => `${(v * 100).toFixed(0)}%`}
                onChange={v => update('tts_rate', v)}
              />
              <SliderSetting
                label="Pitch"
                value={prefs.tts_pitch}
                min={0.5} max={2} step={0.1}
                format={v => v.toFixed(1)}
                onChange={v => update('tts_pitch', v)}
              />
              <SliderSetting
                label="Volume"
                value={prefs.tts_volume}
                min={0} max={1} step={0.1}
                format={v => `${(v * 100).toFixed(0)}%`}
                onChange={v => update('tts_volume', v)}
              />
            </div>
          </div>

          {/* Haptic & Guidance */}
          <div className="bg-gray-950 rounded-2xl border border-white/10 p-6">
            <div className="flex items-center gap-2 mb-5">
              <Vibrate className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white">Feedback</h3>
            </div>
            <div className="space-y-4">
              <ToggleSetting
                label="Haptic Vibration"
                description="Vibrate on Braille detection events"
                value={prefs.haptic_enabled}
                onChange={v => update('haptic_enabled', v)}
              />
              <ToggleSetting
                label="Voice Guidance"
                description='Spoken camera guidance ("move closer", "lighting too low")'
                value={prefs.voice_guidance_enabled}
                onChange={v => update('voice_guidance_enabled', v)}
              />
              <ToggleSetting
                label="Auto-Scan"
                description="Automatically process camera frames"
                value={prefs.auto_scan}
                onChange={v => update('auto_scan', v)}
              />
            </div>
          </div>

          {/* Display */}
          <div className="bg-gray-950 rounded-2xl border border-white/10 p-6">
            <div className="flex items-center gap-2 mb-5">
              <Eye className="w-5 h-5 text-orange-400" />
              <h3 className="font-bold text-white">Display</h3>
            </div>
            <div className="space-y-4">
              <ToggleSetting
                label="High Contrast Mode"
                description="Enhanced contrast for low-vision users"
                value={prefs.high_contrast}
                onChange={v => update('high_contrast', v)}
              />
            </div>
          </div>

          {/* Test TTS */}
          <div className="bg-gray-950 rounded-2xl border border-white/10 p-6">
            <div className="flex items-center gap-2 mb-4">
              <MonitorSpeaker className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-white">Test Voice</h3>
            </div>
            <button
              onClick={() => {
                const utterance = new SpeechSynthesisUtterance('BrailleSense AI is ready. Point your camera at Braille text.');
                utterance.rate = prefs.tts_rate;
                utterance.pitch = prefs.tts_pitch;
                utterance.volume = prefs.tts_volume;
                window.speechSynthesis.speak(utterance);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 font-semibold text-sm rounded-xl border border-blue-500/30 transition-all"
            >
              <Volume2 className="w-4 h-4" />
              Test Current Settings
            </button>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all ${
              saved
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-cyan-500 hover:bg-cyan-400 text-gray-950 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/35'
            }`}
            aria-label={saved ? 'Settings saved' : 'Save settings'}
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : saved ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {saving ? 'Saving...' : saved ? 'Saved' : 'Save Settings'}
          </button>
        </div>
      </div>
    </section>
  );
}

function SliderSetting({ label, value, min, max, step, format, onChange }: {
  label: string;
  value: number;
  min: number; max: number; step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-300 font-medium">{label}</span>
        <span className="text-sm font-mono font-bold text-cyan-400">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-800 rounded-full appearance-none cursor-pointer accent-cyan-500"
        aria-label={label}
      />
    </div>
  );
}

function ToggleSetting({ label, description, value, onChange }: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm text-gray-300 font-medium">{label}</div>
        <div className="text-xs text-gray-600 mt-0.5">{description}</div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-12 h-7 rounded-full transition-all duration-200 flex-shrink-0 ${
          value ? 'bg-cyan-500' : 'bg-gray-700'
        }`}
        role="switch"
        aria-checked={value}
        aria-label={label}
      >
        <div
          className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-200 ${
            value ? 'left-6' : 'left-1'
          }`}
        />
      </button>
    </div>
  );
}
