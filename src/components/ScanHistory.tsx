import { useEffect, useState, useCallback } from 'react';
import { Clock, Trash2, Camera, Upload, PenLine, RefreshCw, AlertCircle } from 'lucide-react';
import { getScanHistory, deleteScanSession, type ScanSession } from '../lib/supabase';

const SOURCE_ICONS: Record<string, typeof Camera> = {
  camera: Camera,
  upload: Upload,
  manual: PenLine,
};

const SOURCE_COLORS: Record<string, string> = {
  camera: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30',
  upload: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
  manual: 'text-orange-400 bg-orange-500/15 border-orange-500/30',
};

export default function ScanHistory() {
  const [sessions, setSessions] = useState<ScanSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    const data = await getScanHistory(50);
    setSessions(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleDelete = useCallback(async (id: string) => {
    const ok = await deleteScanSession(id);
    if (ok) setSessions(prev => prev.filter(s => s.id !== id));
  }, []);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <section id="history" className="py-24 bg-gray-900" aria-label="Scan history">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-xs font-semibold uppercase tracking-widest mb-3">
              <Clock className="w-3.5 h-3.5" />
              Scan History
            </div>
            <h2 className="text-3xl font-black text-white">Past Scans</h2>
          </div>
          <button
            onClick={loadHistory}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 font-semibold text-sm rounded-xl border border-white/10 transition-all disabled:opacity-50"
            aria-label="Refresh scan history"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm mb-6" role="alert">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {loading && sessions.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3 text-gray-500">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Loading history...</span>
            </div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16 bg-gray-950 rounded-2xl border border-white/10">
            <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
              <Clock className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-400 font-medium">No scans yet</p>
            <p className="text-gray-600 text-sm mt-1">Detected Braille text will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map(session => {
              const Icon = SOURCE_ICONS[session.source] || Camera;
              const colorClass = SOURCE_COLORS[session.source] || SOURCE_COLORS.camera;

              return (
                <div
                  key={session.id}
                  className="bg-gray-950 rounded-2xl border border-white/10 p-5 hover:border-white/20 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-bold text-white truncate">
                          {session.detected_text || '(empty)'}
                        </span>
                        <span className="text-xs text-gray-600 font-mono">
                          {Math.round(session.confidence * 100)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{formatDate(session.created_at)}</span>
                        <span className="capitalize">{session.source}</span>
                        {session.braille_cells && Array.isArray(session.braille_cells) && (
                          <span>{session.braille_cells.length} cells</span>
                        )}
                      </div>
                      {/* Braille cell visualization */}
                      {session.braille_cells && Array.isArray(session.braille_cells) && session.braille_cells.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {session.braille_cells.slice(0, 20).map((cell: number[], ci: number) => (
                            <div key={ci} className="grid grid-cols-2 gap-0.5 p-1 bg-gray-900 rounded">
                              {cell.map((active, di) => (
                                <div
                                  key={di}
                                  className={`w-2 h-2 rounded-full ${
                                    active ? 'bg-cyan-400' : 'bg-gray-700'
                                  }`}
                                  aria-hidden="true"
                                />
                              ))}
                            </div>
                          ))}
                          {session.braille_cells.length > 20 && (
                            <span className="text-xs text-gray-600 self-center">+{session.braille_cells.length - 20}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(session.id)}
                      className="flex-shrink-0 p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      aria-label={`Delete scan: ${session.detected_text}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {sessions.length > 0 && (
          <p className="text-center text-gray-600 text-xs mt-6">
            Showing {sessions.length} most recent scans
          </p>
        )}
      </div>
    </section>
  );
}
