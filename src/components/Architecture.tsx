import { useState } from 'react';
import {
  Camera, Cpu, FileText, Volume2, Wifi, ArrowRight, ChevronDown, ChevronUp,
  Layers, GitBranch, Zap, Database
} from 'lucide-react';

const MODULES = [
  {
    id: 'capture',
    icon: Camera,
    color: 'cyan',
    title: 'Camera Capture Module',
    subtitle: 'Flutter + platform camera',
    description: 'Captures live frames from the device camera at 30fps. Uses CameraController in Flutter to stream YUV420 image frames. Includes automatic exposure control, ISO management, and torch/flash toggling for low-light environments.',
    tech: ['Flutter CameraController', 'YUV420 frames', 'Auto-exposure', 'Frame buffer'],
    details: [
      'Streams 640×480 YUV420 frames at 30fps',
      'Automatic frame skipping: processes every 3rd frame',
      'Isolate-based threading to prevent UI jank',
      'Direct memory access — no file I/O',
    ]
  },
  {
    id: 'preprocess',
    icon: Cpu,
    color: 'blue',
    title: 'CV Preprocessing Pipeline',
    subtitle: 'OpenCV + NumPy',
    description: 'Multi-stage image preprocessing optimized for embossed Braille dots. Handles varying lighting, shadows, paper textures, and camera angles. All operations run in <15ms on mobile CPUs.',
    tech: ['OpenCV 4.x', 'NumPy', 'Adaptive threshold', 'Morphological ops'],
    details: [
      'Grayscale + CLAHE histogram equalization',
      'Adaptive Gaussian thresholding (block 15×15)',
      'Morphological erosion to separate touching dots',
      'Perspective correction using Hough lines',
      'Laplacian-based blur detection (reject blurry frames)',
    ]
  },
  {
    id: 'detection',
    icon: Layers,
    color: 'emerald',
    title: 'Dot Detection Engine',
    subtitle: 'Blob analysis + contour filtering',
    description: 'Detects individual Braille dots using SimpleBlobDetector with custom parameters tuned for embossed paper. Filters by circularity, inertia, convexity, and area to eliminate noise.',
    tech: ['SimpleBlobDetector', 'Contour analysis', 'Circularity scoring', 'NMS'],
    details: [
      'Circularity threshold: 0.65–1.0',
      'Area range: 80–2000 px² at 640×480',
      'Inertia ratio: ≥ 0.5 (reject elongated shapes)',
      'Non-maximum suppression to deduplicate',
      'Shadow compensation via local normalization',
    ]
  },
  {
    id: 'segmentation',
    icon: GitBranch,
    color: 'orange',
    title: 'Cell Segmentation',
    subtitle: 'Spatial clustering',
    description: 'Groups detected dots into Braille cells (2×3 grid). Uses density-based spatial clustering to handle varying inter-cell spacing and compensate for perspective distortion.',
    tech: ['DBSCAN clustering', 'Grid projection', 'Spacing estimation', 'Perspective warp'],
    details: [
      'DBSCAN to cluster dots into cell groups',
      'Estimates horizontal/vertical spacing from dot distribution',
      'Assigns each dot to position {1–6} within its cell',
      'Outputs binary 6-bit pattern per cell',
      'Handles up to ±15° tilt with perspective correction',
    ]
  },
  {
    id: 'translation',
    icon: FileText,
    color: 'yellow',
    title: 'Braille Translation Engine',
    subtitle: 'Grade 1 + contractions',
    description: 'Pure Python lookup-based translation with full Grade 1 Braille support. Zero neural network inference — deterministic, fast, and fully offline. Pattern matching runs in <1ms.',
    tech: ['Grade 1 Braille', 'Number indicator', 'Capital indicator', 'Word boundaries'],
    details: [
      'Complete 26-letter alphabet + space cell',
      'Number indicator cell detection',
      'Capital indicator cell detection',
      'Context-aware word boundary detection',
      'Outputs plain English text stream',
    ]
  },
  {
    id: 'accessibility',
    icon: Volume2,
    color: 'pink',
    title: 'Accessibility Output Layer',
    subtitle: 'TTS + haptics + UI',
    description: 'Multi-channel accessibility output designed for blind and visually impaired users. Combines voice-first navigation, haptic patterns, and a minimal high-contrast UI.',
    tech: ['flutter_tts', 'vibration', 'Voice guidance', 'Haptic patterns'],
    details: [
      'flutter_tts: speaks detected text at configurable rate',
      'Haptic burst on successful cell detection',
      'Double-tap: re-read last detected sentence',
      'Long-press: contextual guidance announcement',
      'High-contrast mode, 20sp minimum font size',
    ]
  },
  {
    id: 'offline',
    icon: Wifi,
    color: 'teal',
    title: 'Offline-First Architecture',
    subtitle: 'Zero-internet operation',
    description: 'The entire pipeline runs on-device. Python backend is embedded as a shared library (via dart:ffi or local HTTP). No data leaves the device — critical for user privacy.',
    tech: ['dart:ffi', 'Shared library (.so)', 'Local HTTP', 'No cloud deps'],
    details: [
      'OpenCV compiled as ARM shared library',
      'Flutter communicates via platform channel or local socket',
      'All Braille lookup tables bundled as JSON assets',
      'Zero network permissions required',
      'Works in airplane mode / rural areas',
    ]
  },
  {
    id: 'optimize',
    icon: Zap,
    color: 'red',
    title: 'Real-Time Optimization',
    subtitle: 'Low-latency pipeline',
    description: 'End-to-end latency target: <100ms from frame capture to TTS output. Uses multi-threaded processing, frame skipping, and lightweight algorithms to achieve real-time performance on mid-range phones.',
    tech: ['Threading', 'Frame skipping', 'NEON SIMD', 'Memory pooling'],
    details: [
      'Producer-consumer frame queue (capacity: 3 frames)',
      'OpenCV NEON SIMD acceleration on ARM',
      'Pre-allocated memory pools to avoid GC pressure',
      'Result caching: skip reprocessing identical frames',
      'Target: 10–15fps detection on Snapdragon 660+',
    ]
  },
];

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/25', text: 'text-cyan-400', dot: 'bg-cyan-400' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/25', text: 'text-blue-400', dot: 'bg-blue-400' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/25', text: 'text-orange-400', dot: 'bg-orange-400' },
  yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/25', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/25', text: 'text-pink-400', dot: 'bg-pink-400' },
  teal: { bg: 'bg-teal-500/10', border: 'border-teal-500/25', text: 'text-teal-400', dot: 'bg-teal-400' },
  red: { bg: 'bg-red-500/10', border: 'border-red-500/25', text: 'text-red-400', dot: 'bg-red-400' },
};

function ModuleCard({ module, isExpanded, onToggle }: {
  module: typeof MODULES[0];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const Icon = module.icon;
  const c = COLOR_MAP[module.color];

  return (
    <div
      className={`bg-gray-900 rounded-2xl border border-white/10 overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-1 ring-cyan-500/30' : 'hover:border-white/20'}`}
    >
      <button
        onClick={onToggle}
        className="w-full text-left p-5 flex items-center gap-4"
        aria-expanded={isExpanded}
        aria-controls={`module-details-${module.id}`}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.bg} border ${c.border}`}>
          <Icon className={`w-5 h-5 ${c.text}`} aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white text-sm">{module.title}</div>
          <div className="text-gray-500 text-xs mt-0.5">{module.subtitle}</div>
        </div>
        <div className="text-gray-500">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isExpanded && (
        <div id={`module-details-${module.id}`} className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
          <p className="text-gray-400 text-sm leading-relaxed">{module.description}</p>

          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Implementation Details</div>
            <ul className="space-y-1.5">
              {module.details.map(d => (
                <li key={d} className="flex items-start gap-2 text-sm text-gray-400">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${c.dot}`} aria-hidden="true" />
                  {d}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-2">
            {module.tech.map(t => (
              <span key={t} className={`px-2.5 py-1 rounded-lg text-xs font-medium ${c.bg} ${c.text} border ${c.border}`}>
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Architecture() {
  const [expanded, setExpanded] = useState<string | null>('capture');

  const toggle = (id: string) => setExpanded(prev => prev === id ? null : id);

  return (
    <section id="architecture" className="py-24 bg-gray-900" aria-label="System architecture">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-xs font-semibold uppercase tracking-widest mb-4">
            <Database className="w-3.5 h-3.5" />
            System Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">8-Module Pipeline</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Every component designed for real-world conditions — variable lighting, embossed textures, and mobile-grade CPUs.
          </p>
        </div>

        {/* Pipeline flow diagram */}
        <div className="flex items-center justify-center flex-wrap gap-2 mb-12 text-xs font-semibold">
          {['Camera', 'Preprocess', 'Detect Dots', 'Segment Cells', 'Translate', 'TTS + Haptics'].map((step, i, arr) => (
            <div key={step} className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-gray-800 border border-white/10 rounded-lg text-gray-300 whitespace-nowrap">
                {step}
              </div>
              {i < arr.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>

        {/* Module grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {MODULES.map(module => (
            <ModuleCard
              key={module.id}
              module={module}
              isExpanded={expanded === module.id}
              onToggle={() => toggle(module.id)}
            />
          ))}
        </div>

        {/* Data flow table */}
        <div className="mt-10 bg-gray-900 rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h3 className="font-bold text-white text-sm">End-to-End Latency Breakdown</h3>
          </div>
          <div className="divide-y divide-white/5">
            {[
              { stage: 'Frame capture', latency: '~8ms', note: 'CameraController callback' },
              { stage: 'YUV → Grayscale', latency: '~3ms', note: 'NEON SIMD on ARM' },
              { stage: 'CLAHE + threshold', latency: '~10ms', note: 'OpenCV GPU assist if available' },
              { stage: 'Blob detection', latency: '~12ms', note: 'SimpleBlobDetector' },
              { stage: 'Cell segmentation', latency: '~5ms', note: 'DBSCAN, k≤50 dots' },
              { stage: 'Braille lookup', latency: '<1ms', note: 'Hash map lookup' },
              { stage: 'TTS queue', latency: '~8ms', note: 'flutter_tts sentence queuing' },
              { stage: 'Total (typical)', latency: '~47ms', note: 'Mid-range Android 2023' },
            ].map(row => (
              <div key={row.stage} className="px-5 py-3 flex items-center gap-4 text-sm">
                <span className="flex-1 text-gray-300 font-medium">{row.stage}</span>
                <span className="font-mono font-bold text-cyan-400 w-16 text-right">{row.latency}</span>
                <span className="text-gray-500 text-xs flex-1 text-right hidden sm:block">{row.note}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
