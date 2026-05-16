import { useEffect, useRef } from 'react';
import { ArrowDown, Zap, Shield, Globe } from 'lucide-react';

const PILLS = [
  { icon: Zap, text: 'Real-time CV Pipeline' },
  { icon: Shield, text: '100% Offline' },
  { icon: Globe, text: 'Grade 1 Braille' },
];

// Animated Braille dot grid for background decoration
function BrailleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Animated dots
    const COLS = 18;
    const ROWS = 10;
    const dots: { x: number; y: number; alpha: number; speed: number; phase: number }[] = [];

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        dots.push({
          x: (c / COLS) * canvas.width + canvas.width / COLS / 2,
          y: (r / ROWS) * canvas.height + canvas.height / ROWS / 2,
          alpha: 0.05 + Math.random() * 0.2,
          speed: 0.3 + Math.random() * 0.7,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    let raf: number;
    const animate = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Recompute dot positions relative to current canvas size
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        const r = Math.floor(i / COLS);
        const c = i % COLS;
        dot.x = (c / COLS) * canvas.width + canvas.width / COLS / 2;
        dot.y = (r / ROWS) * canvas.height + canvas.height / ROWS / 2;
        const a = dot.alpha * (0.6 + 0.4 * Math.sin(t * 0.001 * dot.speed + dot.phase));
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34, 211, 238, ${a})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}

export default function Hero() {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gray-950"
      aria-label="BrailleSense AI hero section"
    >
      {/* Gradient radial background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(6,182,212,0.15),transparent)]" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_80%_80%,rgba(6,182,212,0.05),transparent)]" aria-hidden="true" />

      <BrailleBackground />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/25 rounded-full text-cyan-400 text-sm font-medium mb-8 animate-fade-in">
          <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" aria-hidden="true" />
          Hackathon Project — Accessibility AI
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-tight mb-6 tracking-tight">
          Braille
          <span className="text-cyan-400">Sense</span>
          <span className="block text-3xl sm:text-4xl lg:text-5xl font-semibold text-gray-300 mt-2">
            See Braille. Hear Words.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Real-time AI that reads physical embossed Braille dots through a camera,
          converts them to English, and speaks them aloud — fully offline, no internet required.
        </p>

        {/* Pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          {PILLS.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300">
              <Icon className="w-4 h-4 text-cyan-400" />
              {text}
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <a
            href="#demo"
            className="w-full sm:w-auto px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold text-base rounded-2xl transition-all duration-150 shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-400/40 hover:scale-105 active:scale-95"
            aria-label="Open live camera demo"
          >
            Launch Live Demo
          </a>
          <a
            href="#architecture"
            className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold text-base rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-150"
            aria-label="View system architecture"
          >
            Explore Architecture
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 max-w-md mx-auto mb-16">
          {[
            { value: '<100ms', label: 'Latency' },
            { value: '97%', label: 'Accuracy' },
            { value: '26+', label: 'Braille Chars' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-black text-cyan-400">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5 font-medium uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <a
        href="#demo"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gray-500 hover:text-cyan-400 transition-colors animate-bounce"
        aria-label="Scroll to demo"
      >
        <span className="text-xs font-medium uppercase tracking-widest">Scroll</span>
        <ArrowDown className="w-4 h-4" />
      </a>
    </section>
  );
}
