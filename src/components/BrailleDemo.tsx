import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Volume2, ChevronRight } from 'lucide-react';
import { textToBrailleCells, brailleCellsToText, type BrailleCell } from '../utils/brailleMap';
import { useTTS } from '../hooks/useTTS';
import { saveScanSession } from '../lib/supabase';

const DEMO_TEXTS = [
  { text: 'hello world', label: 'Hello World' },
  { text: 'the quick brown fox', label: 'Quick Brown Fox' },
  { text: 'braille is beautiful', label: 'Braille Is Beautiful' },
  { text: 'reading made easy', label: 'Reading Made Easy' },
  { text: 'open your world', label: 'Open Your World' },
  { text: 'feel the letters', label: 'Feel The Letters' },
  { text: 'accessibility matters', label: 'Accessibility Matters' },
  { text: 'sense and vision', label: 'Sense And Vision' },
];

// Render a Braille cell on canvas
function drawBrailleCell(
  ctx: CanvasRenderingContext2D,
  cell: BrailleCell,
  x: number,
  y: number,
  cellW: number,
  cellH: number,
  highlight = false
) {
  const dotRadius = cellW * 0.12;
  const positions = [
    [x + cellW * 0.3, y + cellH * 0.2],  // dot 1
    [x + cellW * 0.3, y + cellH * 0.5],  // dot 2
    [x + cellW * 0.3, y + cellH * 0.8],  // dot 3
    [x + cellW * 0.7, y + cellH * 0.2],  // dot 4
    [x + cellW * 0.7, y + cellH * 0.5],  // dot 5
    [x + cellW * 0.7, y + cellH * 0.8],  // dot 6
  ];

  // Cell background
  if (highlight) {
    ctx.fillStyle = 'rgba(34, 211, 238, 0.08)';
    ctx.fillRect(x, y, cellW, cellH);
  }

  // Draw dots
  for (let i = 0; i < 6; i++) {
    const [dx, dy] = positions[i];
    ctx.beginPath();
    ctx.arc(dx, dy, dotRadius, 0, Math.PI * 2);

    if (cell[i]) {
      // Raised dot - embossed look
      const gradient = ctx.createRadialGradient(dx - 1, dy - 1, 0, dx, dy, dotRadius);
      gradient.addColorStop(0, highlight ? '#67e8f9' : '#d1d5db');
      gradient.addColorStop(0.7, highlight ? '#22d3ee' : '#9ca3af');
      gradient.addColorStop(1, highlight ? '#0891b2' : '#6b7280');
      ctx.fillStyle = gradient;
      ctx.fill();

      // Shadow for 3D embossed effect
      ctx.beginPath();
      ctx.arc(dx + 1, dy + 1, dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fill();

      // Redraw dot on top
      ctx.beginPath();
      ctx.arc(dx, dy, dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    } else {
      // Flat dot position marker
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fill();
    }
  }
}

export default function BrailleDemo() {
  const [selectedText, setSelectedText] = useState(DEMO_TEXTS[0]);
  const [cells, setCells] = useState<BrailleCell[]>([]);
  const [activeCellIndex, setActiveCellIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [detectedChars, setDetectedChars] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { speak, speaking, stop: stopTTS } = useTTS({ rate: 0.8 });

  // Generate cells when text changes
  useEffect(() => {
    const newCells = textToBrailleCells(selectedText.text);
    setCells(newCells);
    setActiveCellIndex(-1);
    setDetectedChars([]);
  }, [selectedText]);

  // Draw Braille paper on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || cells.length === 0) return;

    const cellW = 48;
    const cellH = 64;
    const padding = 40;
    const gap = 8;
    const maxCellsPerRow = 12;

    const rows = Math.ceil(cells.length / maxCellsPerRow);
    const canvasW = padding * 2 + maxCellsPerRow * (cellW + gap);
    const canvasH = padding * 2 + rows * (cellH + gap) + 20;

    canvas.width = canvasW;
    canvas.height = canvasH;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Paper background
    ctx.fillStyle = '#f5f0e8';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Paper texture (subtle noise)
    for (let i = 0; i < 2000; i++) {
      const nx = Math.random() * canvasW;
      const ny = Math.random() * canvasH;
      ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.02})`;
      ctx.fillRect(nx, ny, 1, 1);
    }

    // Paper border
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(4, 4, canvasW - 8, canvasH - 8);

    // Draw cells
    cells.forEach((cell, i) => {
      const row = Math.floor(i / maxCellsPerRow);
      const col = i % maxCellsPerRow;
      const x = padding + col * (cellW + gap);
      const y = padding + row * (cellH + gap);
      const highlight = i <= activeCellIndex && i >= 0;
      drawBrailleCell(ctx, cell, x, y, cellW, cellH, highlight);
    });

    // Scan line animation
    if (isPlaying && activeCellIndex >= 0) {
      const row = Math.floor(activeCellIndex / maxCellsPerRow);
      const col = activeCellIndex % maxCellsPerRow;
      const scanX = padding + col * (cellW + gap);
      const scanY = padding + row * (cellH + gap);

      const gradient = ctx.createLinearGradient(scanX, scanY - 10, scanX, scanY + cellH + 10);
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(0.5, 'rgba(34, 211, 238, 0.3)');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, scanY - 10, canvasW, cellH + 20);
    }
  }, [cells, activeCellIndex, isPlaying]);

  // Playback animation
  useEffect(() => {
    if (!isPlaying) return;

    let index = 0;
    setDetectedChars([]);
    setActiveCellIndex(0);

    const interval = setInterval(() => {
      if (index >= cells.length) {
        setIsPlaying(false);
        setActiveCellIndex(cells.length - 1);
        // Speak full text
        const fullText = brailleCellsToText(cells);
        speak(`Complete: ${fullText}`, true);
        clearInterval(interval);
        return;
      }

      setActiveCellIndex(index);
      const char = brailleCellsToText([cells[index]]);
      setDetectedChars(prev => [...prev, char]);

      // Haptic feedback
      if ('vibrate' in navigator) navigator.vibrate(30);

      // Speak character
      if (char && char !== ' ') {
        speak(char, false);
      }

      index++;
    }, 400);

    return () => clearInterval(interval);
  }, [isPlaying, cells, speak]);

  const handleSave = useCallback(async () => {
    const text = brailleCellsToText(cells);
    await saveScanSession({
      detected_text: text,
      braille_cells: cells,
      confidence: 0.95,
      frame_metrics: { blur: 0.9, brightness: 180, angle: 0 },
      source: 'manual',
    });
  }, [cells]);

  return (
    <section id="braille-demo" className="py-24 bg-gray-950" aria-label="Interactive Braille demo">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-xs font-semibold uppercase tracking-widest mb-4">
            <Play className="w-3.5 h-3.5" />
            Interactive Demo
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">See It In Action</h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Watch the AI scan simulated Braille paper, detect each cell, and read it aloud character by character.
          </p>
        </div>

        {/* Text selector */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {DEMO_TEXTS.map(item => (
            <button
              key={item.text}
              onClick={() => { setSelectedText(item); setIsPlaying(false); stopTTS(); }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                selectedText.text === item.text
                  ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                  : 'bg-gray-900 text-gray-400 border-white/10 hover:border-white/20 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Braille paper canvas */}
          <div className="bg-gray-900 rounded-2xl border border-white/10 overflow-hidden">
            <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-300">Simulated Braille Paper</span>
              <span className="text-xs text-gray-600 font-mono">{cells.length} cells</span>
            </div>
            <div className="p-4 flex items-center justify-center bg-gray-950 overflow-x-auto">
              <canvas
                ref={canvasRef}
                className="rounded-lg shadow-xl max-w-full"
                style={{ imageRendering: 'auto' }}
                aria-label={`Braille paper showing: ${selectedText.text}`}
              />
            </div>
          </div>

          {/* Detection output */}
          <div className="space-y-4">
            {/* Playback controls */}
            <div className="bg-gray-900 rounded-2xl border border-white/10 p-5">
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-cyan-500/25"
                  aria-label={isPlaying ? 'Pause scanning' : 'Start scanning'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isPlaying ? 'Pause' : 'Start Scan'}
                </button>
                <button
                  onClick={() => { setActiveCellIndex(-1); setDetectedChars([]); setIsPlaying(false); stopTTS(); }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 font-semibold text-sm rounded-xl border border-white/10 transition-all"
                  aria-label="Reset scan"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
                <button
                  onClick={() => speak(brailleCellsToText(cells), true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 font-semibold text-sm rounded-xl border border-white/10 transition-all"
                  aria-label="Read full text"
                >
                  <Volume2 className="w-4 h-4" />
                  Read All
                  {speaking && <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />}
                </button>
              </div>

              {/* Progress */}
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                  style={{ width: `${cells.length > 0 ? ((activeCellIndex + 1) / cells.length) * 100 : 0}%` }}
                  role="progressbar"
                  aria-valuenow={activeCellIndex + 1}
                  aria-valuemin={0}
                  aria-valuemax={cells.length}
                />
              </div>
              <div className="text-xs text-gray-600 font-mono">
                Cell {activeCellIndex + 1} / {cells.length}
              </div>
            </div>

            {/* Detected text output */}
            <div className="bg-gray-900 rounded-2xl border border-white/10 p-5">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Detected Text</div>
              <div className="min-h-16 flex items-center flex-wrap gap-0.5" aria-live="polite">
                {detectedChars.length > 0 ? (
                  detectedChars.map((ch, i) => (
                    <span
                      key={i}
                      className={`inline-block text-2xl font-black transition-all duration-200 ${
                        i === detectedChars.length - 1
                          ? 'text-cyan-400 scale-110'
                          : 'text-white'
                      }`}
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      {ch === ' ' ? '\u00A0' : ch}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-600 text-sm italic">Press "Start Scan" to begin detection</span>
                )}
              </div>
            </div>

            {/* Cell-by-cell breakdown */}
            <div className="bg-gray-900 rounded-2xl border border-white/10 p-5">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Cell Breakdown</div>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                {cells.map((cell, i) => {
                  const char = brailleCellsToText([cell]);
                  const isActive = i === activeCellIndex;
                  const isScanned = i <= activeCellIndex && activeCellIndex >= 0;

                  return (
                    <div
                      key={i}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                        isActive
                          ? 'bg-cyan-500/15 border-cyan-500/40 scale-110'
                          : isScanned
                          ? 'bg-emerald-500/10 border-emerald-500/20'
                          : 'bg-gray-950 border-white/5'
                      }`}
                    >
                      <div className="grid grid-cols-2 gap-0.5">
                        {cell.map((active, di) => (
                          <div
                            key={di}
                            className={`w-2.5 h-2.5 rounded-full ${
                              active
                                ? isActive ? 'bg-cyan-400' : isScanned ? 'bg-emerald-400' : 'bg-gray-400'
                                : 'bg-gray-700'
                            }`}
                            aria-hidden="true"
                          />
                        ))}
                      </div>
                      <span className={`text-xs font-bold ${
                        isActive ? 'text-cyan-400' : isScanned ? 'text-emerald-400' : 'text-gray-600'
                      }`}>
                        {char === ' ' ? '_' : char}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-semibold text-sm rounded-xl border border-white/10 transition-all"
            >
              Save to History
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
