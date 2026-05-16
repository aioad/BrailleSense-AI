import { useState } from 'react';
import { CheckCircle, Circle, Clock, ChevronRight, Map } from 'lucide-react';

const PHASES = [
  {
    phase: 'Phase 1',
    title: 'Foundation',
    duration: 'Week 1–2',
    status: 'complete' as const,
    color: 'emerald',
    steps: [
      { task: 'Flutter project setup + CameraController integration', done: true },
      { task: 'Python FastAPI backend skeleton', done: true },
      { task: 'OpenCV preprocessing pipeline (CLAHE, threshold, morphology)', done: true },
      { task: 'SimpleBlobDetector tuning for embossed Braille dots', done: true },
      { task: 'Grade 1 Braille lookup table (all 26 letters + space)', done: true },
      { task: 'Basic Flutter ↔ Python HTTP communication', done: true },
    ]
  },
  {
    phase: 'Phase 2',
    title: 'Detection Engine',
    duration: 'Week 3–4',
    status: 'complete' as const,
    color: 'cyan',
    steps: [
      { task: 'DBSCAN cell segmentation algorithm', done: true },
      { task: 'Perspective correction via Hough line detection', done: true },
      { task: 'Blur detection + low-light detection', done: true },
      { task: 'Shadow normalization pass', done: true },
      { task: 'Number indicator + capital indicator support', done: true },
      { task: 'Unit tests for cell segmentation logic', done: true },
    ]
  },
  {
    phase: 'Phase 3',
    title: 'Accessibility Layer',
    duration: 'Week 5–6',
    status: 'complete' as const,
    color: 'blue',
    steps: [
      { task: 'flutter_tts integration with sentence queuing', done: true },
      { task: 'Haptic feedback patterns (detection / error / guidance)', done: true },
      { task: 'Smart camera guidance voice announcements', done: true },
      { task: 'High-contrast accessible UI (WCAG AA)', done: true },
      { task: 'Semantics / screen reader labels throughout', done: true },
      { task: 'Voice-first navigation (no eyes required)', done: true },
    ]
  },
  {
    phase: 'Phase 4',
    title: 'Offline & Performance',
    duration: 'Week 7–8',
    status: 'complete' as const,
    color: 'orange',
    steps: [
      { task: 'Python backend compiled as ARM shared library (.so)', done: true },
      { task: 'dart:ffi bindings for zero-IPC local inference', done: true },
      { task: 'Isolate-based frame processing thread', done: true },
      { task: 'Frame skip + result caching optimization', done: true },
      { task: 'Memory pool to eliminate GC pauses', done: true },
      { task: 'End-to-end latency profiling + tuning', done: true },
    ]
  },
  {
    phase: 'Phase 5',
    title: 'Production Polish',
    duration: 'Week 9–10',
    status: 'progress' as const,
    color: 'yellow',
    steps: [
      { task: 'Real-world Braille book testing (50+ pages)', done: true },
      { task: 'Lighting condition robustness testing', done: true },
      { task: 'Handwritten Braille adaptation', done: false },
      { task: 'Onboarding flow for new users', done: false },
      { task: 'App Store / Play Store submission', done: false },
      { task: 'Accessibility audit by visually impaired users', done: false },
    ]
  },
  {
    phase: 'Phase 6',
    title: 'Future Vision',
    duration: 'Q2–Q4 2025',
    status: 'pending' as const,
    color: 'pink',
    steps: [
      { task: 'Grade 2 Braille contractions support', done: false },
      { task: 'Multilingual Braille (Spanish, French, Arabic)', done: false },
      { task: 'Smart glasses integration (Ray-Ban Meta)', done: false },
      { task: 'Edge AI model for noise-robust detection', done: false },
      { task: 'Cloud sync for reading history', done: false },
      { task: 'Wearable haptic glove companion app', done: false },
    ]
  },
];

const COLOR_MAP: Record<string, { ring: string; badge: string; icon: string; progress: string }> = {
  emerald: { ring: 'ring-emerald-500/30', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: 'text-emerald-400', progress: 'bg-emerald-500' },
  cyan: { ring: 'ring-cyan-500/30', badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30', icon: 'text-cyan-400', progress: 'bg-cyan-500' },
  blue: { ring: 'ring-blue-500/30', badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: 'text-blue-400', progress: 'bg-blue-500' },
  orange: { ring: 'ring-orange-500/30', badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30', icon: 'text-orange-400', progress: 'bg-orange-500' },
  yellow: { ring: 'ring-yellow-500/30', badge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', icon: 'text-yellow-400', progress: 'bg-yellow-500' },
  pink: { ring: 'ring-pink-500/30', badge: 'bg-pink-500/15 text-pink-400 border-pink-500/30', icon: 'text-pink-400', progress: 'bg-pink-500' },
};

export default function Roadmap() {
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <section id="roadmap" className="py-24 bg-gray-900" aria-label="Development roadmap">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-xs font-semibold uppercase tracking-widest mb-4">
            <Map className="w-3.5 h-3.5" />
            Roadmap
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">10-Week Build Plan</h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            From zero to production-ready assistive app in 10 focused weeks.
          </p>
        </div>

        <div className="space-y-4">
          {PHASES.map((phase, i) => {
            const c = COLOR_MAP[phase.color];
            const doneCount = phase.steps.filter(s => s.done).length;
            const pct = Math.round((doneCount / phase.steps.length) * 100);
            const isOpen = expanded === i;

            return (
              <div
                key={i}
                className={`bg-gray-950 rounded-2xl border border-white/10 overflow-hidden transition-all ${isOpen ? `ring-1 ${c.ring}` : 'hover:border-white/20'}`}
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : i)}
                  className="w-full text-left p-5 flex items-center gap-4"
                  aria-expanded={isOpen}
                >
                  {/* Status icon */}
                  <div className={`flex-shrink-0 ${c.icon}`}>
                    {phase.status === 'complete' ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : phase.status === 'progress' ? (
                      <Clock className="w-5 h-5" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-white">{phase.phase}: {phase.title}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${c.badge}`}>
                        {phase.duration}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${c.progress}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-gray-500">{doneCount}/{phase.steps.length}</span>
                    </div>
                  </div>

                  <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 border-t border-white/5 pt-4 space-y-2">
                    {phase.steps.map((step, j) => (
                      <div key={j} className="flex items-start gap-3 text-sm">
                        <div className={`mt-0.5 flex-shrink-0 ${step.done ? c.icon : 'text-gray-700'}`}>
                          {step.done ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </div>
                        <span className={step.done ? 'text-gray-300' : 'text-gray-600'}>{step.task}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
