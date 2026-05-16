import { Eye, Github, ExternalLink } from 'lucide-react';

const README_SECTIONS = [
  '# BrailleSense AI',
  '',
  '> Real-time physical Braille detection using computer vision — fully offline.',
  '',
  '## Features',
  '- Live camera Braille dot detection (embossed + handwritten)',
  '- OpenCV adaptive threshold + SimpleBlobDetector pipeline',
  '- DBSCAN cell segmentation for 2×3 Braille grids',
  '- Grade 1 Braille → English translation',
  '- Text-to-Speech output (flutter_tts)',
  '- Haptic feedback patterns',
  '- Smart camera guidance (blur, tilt, lighting)',
  '- 100% offline — no internet required',
  '- <100ms end-to-end latency',
  '',
  '## Tech Stack',
  '| Layer | Technology |',
  '|-------|-----------|',
  '| Frontend | Flutter 3.x |',
  '| CV Engine | OpenCV 4.x + NumPy |',
  '| Bridge | dart:ffi / local HTTP |',
  '| TTS | flutter_tts |',
  '| Haptics | vibration |',
  '',
  '## Quick Start',
  '```bash',
  'git clone https://github.com/yourname/braillesense-ai',
  'cd braillesense-ai/python_backend',
  'pip install -r requirements.txt',
  'python main.py  # Dev API server',
  '',
  'cd ../flutter_app',
  'flutter pub get',
  'flutter run',
  '```',
  '',
  '## License',
  'MIT — open source for accessibility.',
];

export default function Footer() {
  return (
    <>
      {/* GitHub README preview */}
      <section id="github" className="py-24 bg-gray-950" aria-label="GitHub README">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-xs font-semibold uppercase tracking-widest mb-4">
              <Github className="w-3.5 h-3.5" />
              GitHub README
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Open Source</h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Production-ready README for your GitHub repository.
            </p>
          </div>

          <div className="bg-gray-900 rounded-2xl border border-white/10 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3.5 bg-gray-950/80 border-b border-white/10">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
              </div>
              <span className="text-gray-400 text-xs font-mono">README.md</span>
              <div className="ml-auto flex items-center gap-1 text-gray-500 text-xs">
                <Github className="w-3.5 h-3.5" />
                <span>braillesense-ai</span>
                <ExternalLink className="w-3 h-3" />
              </div>
            </div>
            <pre className="p-6 text-xs text-gray-400 font-mono leading-relaxed overflow-x-auto max-h-96 whitespace-pre-wrap">
              {README_SECTIONS.join('\n')}
            </pre>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 border-t border-white/10 py-12" role="contentinfo">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-3 gap-8 mb-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-cyan-500 rounded-xl flex items-center justify-center">
                  <Eye className="w-4 h-4 text-gray-950" strokeWidth={2.5} />
                </div>
                <span className="font-bold text-white">
                  Braille<span className="text-cyan-400">Sense</span> AI
                </span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                Real-time assistive technology for the visually impaired.
                Open source. Offline-first. Human-centered.
              </p>
            </div>

            {/* Links */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Sections</div>
              <ul className="space-y-2">
                {[
                  ['Live Demo', '#demo'],
                  ['Architecture', '#architecture'],
                  ['Roadmap', '#roadmap'],
                  ['Pitch Deck', '#pitch'],
                  ['GitHub', '#github'],
                ].map(([label, href]) => (
                  <li key={href}>
                    <a href={href} className="text-gray-400 hover:text-white text-sm transition-colors">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Stack */}
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Built With</div>
              <ul className="space-y-2">
                {[
                  'Flutter 3.x',
                  'Python 3.11',
                  'OpenCV 4.x',
                  'NumPy + SciPy',
                  'flutter_tts',
                  'dart:ffi',
                ].map(tech => (
                  <li key={tech} className="text-gray-400 text-sm">{tech}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 text-sm">
              BrailleSense AI — Hackathon 2025. MIT License.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" aria-hidden="true" />
              Accessibility-first. Vision-forward.
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
