import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera, CameraOff, Volume2, VolumeX, Vibrate, Eye, AlertCircle,
  CheckCircle, Info, Maximize2, RefreshCw, Save
} from 'lucide-react';
import { useBrailleDetection } from '../hooks/useBrailleDetection';
import { useTTS } from '../hooks/useTTS';
import { saveScanSession } from '../lib/supabase';
import BrailleCellVisualizer from './BrailleCellVisualizer';

export default function LiveDemo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [lastSpoken, setLastSpoken] = useState('');
  const [saved, setSaved] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const { state, startDetection, stopDetection } = useBrailleDetection(videoRef);
  const { speak, stop: stopTTS, speaking } = useTTS({ rate: 0.85, pitch: 1 });

  const startCamera = useCallback(async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      startDetection();
      speak('Camera active. Point at Braille text to begin scanning.', true);
    } catch {
      setCameraError('Camera access denied. Please allow camera permission.');
      speak('Camera access denied. Please allow camera permission.', true);
    }
  }, [startDetection, speak]);

  const stopCamera = useCallback(() => {
    stopDetection();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
    stopTTS();
  }, [stopDetection, stopTTS]);

  // Draw detection overlays on canvas
  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !cameraActive) return;

    const drawOverlays = () => {
      canvas.width = video.clientWidth;
      canvas.height = video.clientHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw detected dots
      if (state.dots.length > 0) {
        const scaleX = canvas.width / 320;
        const scaleY = canvas.height / 240;

        for (const dot of state.dots) {
          ctx.beginPath();
          ctx.arc(dot.x * scaleX, dot.y * scaleY, dot.radius * Math.min(scaleX, scaleY), 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(34, 211, 238, ${dot.confidence})`;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = `rgba(34, 211, 238, 0.15)`;
          ctx.fill();
        }
      }

      // Draw scan line
      const scanY = ((performance.now() % 2000) / 2000) * canvas.height;
      const gradient = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(0.5, 'rgba(34, 211, 238, 0.3)');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, scanY - 20, canvas.width, 40);

      if (cameraActive) requestAnimationFrame(drawOverlays);
    };

    drawOverlays();
  }, [state.dots, cameraActive]);

  // TTS for detected text
  useEffect(() => {
    if (!ttsEnabled || !state.detectedText || state.detectedText === lastSpoken) return;
    setLastSpoken(state.detectedText);
    speak(`Detected: ${state.detectedText}`, true);
  }, [state.detectedText, ttsEnabled, lastSpoken, speak]);

  // Guidance TTS
  const guidanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!ttsEnabled || !cameraActive) return;
    if (guidanceTimerRef.current) clearTimeout(guidanceTimerRef.current);
    if (!state.detectedText) {
      guidanceTimerRef.current = setTimeout(() => {
        speak(state.guidance, false);
      }, 5000);
    }
    return () => { if (guidanceTimerRef.current) clearTimeout(guidanceTimerRef.current); };
  }, [state.guidance, state.detectedText, ttsEnabled, cameraActive, speak]);

  const handleSave = useCallback(async () => {
    if (!state.detectedText) return;
    const ok = await saveScanSession({
      detected_text: state.detectedText,
      braille_cells: state.cells,
      confidence: state.confidence,
      frame_metrics: { blur: state.blur, brightness: state.brightness },
      source: 'camera',
    });
    if (ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
  }, [state.detectedText, state.cells, state.confidence, state.blur, state.brightness]);

  const getStatusColor = () => {
    if (!cameraActive) return 'text-gray-500';
    if (state.blur < 0.2) return 'text-amber-400';
    if (state.brightness < 40 || state.brightness > 220) return 'text-red-400';
    if (state.detectedText) return 'text-emerald-400';
    return 'text-cyan-400';
  };

  const getStatusIcon = () => {
    if (!cameraActive) return <CameraOff className="w-4 h-4" />;
    if (state.detectedText) return <CheckCircle className="w-4 h-4" />;
    if (state.blur < 0.2 || state.brightness < 40) return <AlertCircle className="w-4 h-4" />;
    return <Eye className="w-4 h-4 animate-pulse" />;
  };

  return (
    <section id="demo" className="py-24 bg-gray-950" aria-label="Live Braille detection demo">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-xs font-semibold uppercase tracking-widest mb-4">
            <Camera className="w-3.5 h-3.5" />
            Live Camera Demo
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Real-Time Braille Detection</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Enable your camera and point it at physical Braille text.
            The CV pipeline detects dots, builds cells, and reads them aloud.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6 items-start">
          {/* Camera panel */}
          <div className="lg:col-span-3 space-y-4">
            <div className="relative bg-gray-900 rounded-2xl overflow-hidden border border-white/10 aspect-video">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
                autoPlay
                aria-label="Camera feed"
              />
              <canvas
                ref={overlayCanvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
                aria-hidden="true"
              />

              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                  <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mb-4 border border-white/10">
                    <Camera className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-gray-400 font-medium">Camera not active</p>
                  <p className="text-gray-600 text-sm mt-1">Click "Start Scanning" to begin</p>
                </div>
              )}

              {cameraActive && (
                <>
                  <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-cyan-400/60 rounded-tl-md" aria-hidden="true" />
                  <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-cyan-400/60 rounded-tr-md" aria-hidden="true" />
                  <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-cyan-400/60 rounded-bl-md" aria-hidden="true" />
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-cyan-400/60 rounded-br-md" aria-hidden="true" />
                </>
              )}

              {cameraActive && (
                <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-lg border border-white/10">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" aria-hidden="true" />
                  <span className="text-white text-xs font-mono font-semibold">{state.fps} FPS</span>
                  {state.processingTime > 0 && (
                    <span className="text-gray-400 text-xs font-mono">{state.processingTime.toFixed(0)}ms</span>
                  )}
                </div>
              )}

              {cameraError && (
                <div className="absolute inset-x-4 bottom-4 flex items-center gap-2 px-4 py-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-400 text-sm" role="alert">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={cameraActive ? stopCamera : startCamera}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-150 ${
                  cameraActive
                    ? 'bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-gray-950 shadow-lg shadow-cyan-500/25 hover:scale-105 active:scale-95'
                }`}
                aria-label={cameraActive ? 'Stop camera' : 'Start camera scanning'}
              >
                {cameraActive ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                {cameraActive ? 'Stop Scanning' : 'Start Scanning'}
              </button>

              <button
                onClick={() => {
                  setTtsEnabled(!ttsEnabled);
                  if (ttsEnabled) stopTTS();
                }}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm border transition-all duration-150 ${
                  ttsEnabled
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                    : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                }`}
                aria-label={ttsEnabled ? 'Disable voice output' : 'Enable voice output'}
                aria-pressed={ttsEnabled}
              >
                {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                Voice {ttsEnabled ? 'On' : 'Off'}
                {speaking && <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse ml-1" aria-label="Speaking" />}
              </button>

              <button
                onClick={() => { if ('vibrate' in navigator) navigator.vibrate([50, 30, 50]); }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white transition-all duration-150"
                aria-label="Test haptic vibration feedback"
              >
                <Vibrate className="w-4 h-4" />
                Haptic
              </button>

              {state.detectedText && (
                <button
                  onClick={handleSave}
                  disabled={saved}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm border transition-all duration-150 ${
                    saved
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                  aria-label={saved ? 'Saved to history' : 'Save scan to history'}
                >
                  <Save className="w-4 h-4" />
                  {saved ? 'Saved' : 'Save'}
                </button>
              )}

              {cameraActive && (
                <button
                  onClick={() => { stopCamera(); setTimeout(startCamera, 300); }}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white transition-all duration-150 ml-auto"
                  aria-label="Flip camera"
                >
                  <RefreshCw className="w-4 h-4" />
                  Flip
                </button>
              )}
            </div>

            {/* Guidance bar */}
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
              state.detectedText
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                : 'bg-white/5 border-white/10 text-gray-400'
            }`} role="status" aria-live="polite">
              <span className={getStatusColor()}>
                {getStatusIcon()}
              </span>
              <span>{cameraActive ? state.guidance : 'Camera inactive — press Start Scanning'}</span>
            </div>
          </div>

          {/* Right panel: output */}
          <div className="lg:col-span-2 space-y-4">
            {/* Detected text */}
            <div className="bg-gray-900 rounded-2xl border border-white/10 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4 text-cyan-400" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Detected Text</h3>
                {state.detectedText && (
                  <span className="ml-auto text-xs text-emerald-400 font-semibold">
                    {Math.round(state.confidence * 100)}% confidence
                  </span>
                )}
              </div>
              <div className="min-h-20 flex items-center justify-center text-center" aria-live="polite" aria-label="Detected Braille text output">
                {state.detectedText ? (
                  <p className="text-3xl font-black text-white tracking-wide leading-tight">
                    {state.detectedText}
                  </p>
                ) : (
                  <p className="text-gray-600 text-sm italic">Waiting for Braille detection...</p>
                )}
              </div>
            </div>

            {/* Braille cell visualizer */}
            <div className="bg-gray-900 rounded-2xl border border-white/10 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4 flex items-center justify-center" aria-hidden="true">
                  <span className="text-cyan-400 text-xs font-black">⠿</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Braille Cells</h3>
              </div>
              <BrailleCellVisualizer cells={state.cells} />
            </div>

            {/* Metrics */}
            <div className="bg-gray-900 rounded-2xl border border-white/10 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Maximize2 className="w-4 h-4 text-cyan-400" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Frame Analysis</h3>
              </div>
              <div className="space-y-3">
                <Metric
                  label="Sharpness"
                  value={state.blur}
                  format={v => `${Math.round(v * 100)}%`}
                  good={v => v > 0.3}
                  warn={v => v >= 0.15 && v <= 0.3}
                />
                <Metric
                  label="Brightness"
                  value={state.brightness / 255}
                  format={() => `${Math.round(state.brightness)}/255`}
                  good={v => v > 0.2 && v < 0.85}
                  warn={v => (v >= 0.15 && v <= 0.2) || (v >= 0.85 && v <= 0.9)}
                />
                <Metric
                  label="Dots Found"
                  value={Math.min(1, state.dots.length / 30)}
                  format={() => `${state.dots.length}`}
                  good={v => v > 0.1}
                  warn={() => false}
                />
                <Metric
                  label="Cells Parsed"
                  value={Math.min(1, state.cells.length / 12)}
                  format={() => `${state.cells.length}`}
                  good={v => v > 0.05}
                  warn={() => false}
                />
                <Metric
                  label="Processing"
                  value={Math.min(1, state.processingTime / 200)}
                  format={() => `${state.processingTime.toFixed(0)}ms`}
                  good={v => v < 0.5}
                  warn={v => v >= 0.5 && v <= 0.8}
                />
              </div>
            </div>

            {/* Info note */}
            <div className="flex items-start gap-3 px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 text-xs leading-relaxed">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                This demo runs the full CV pipeline in your browser using Canvas API.
                For best results, point at high-contrast Braille on light paper.
                The Flutter + Python app adds OpenCV optimizations for mobile.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({
  label, value, format, good, warn
}: {
  label: string;
  value: number;
  format: (v: number) => string;
  good: (v: number) => boolean;
  warn: (v: number) => boolean;
}) {
  const isGood = good(value);
  const isWarn = warn(value);
  const color = isGood ? 'bg-emerald-500' : isWarn ? 'bg-amber-500' : 'bg-gray-700';

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-400 font-medium">{label}</span>
        <span className={`font-mono font-semibold ${isGood ? 'text-emerald-400' : isWarn ? 'text-amber-400' : 'text-gray-500'}`}>
          {format(value)}
        </span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(100, value * 100)}%` }}
          role="progressbar"
          aria-valuenow={Math.round(value * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        />
      </div>
    </div>
  );
}
