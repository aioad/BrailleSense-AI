import { useState, useCallback, useRef } from 'react';
import { Upload, ImagePlus, Loader2, AlertCircle, CheckCircle, Volume2 } from 'lucide-react';
import { processImageFile, renderProcessingVisualization, type ProcessingResult } from '../utils/imageProcessing';
import { saveScanSession } from '../lib/supabase';
import { useTTS } from '../hooks/useTTS';
import BrailleCellVisualizer from './BrailleCellVisualizer';
import { type BrailleCell } from '../utils/brailleMap';

export default function ImageUpload() {
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const vizCanvasRef = useRef<HTMLCanvasElement>(null);
  const { speak, speaking } = useTTS({ rate: 0.85 });

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, etc.)');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setSaved(false);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const res = await processImageFile(file);
      setResult(res);

      // Render visualization
      setTimeout(() => {
        if (vizCanvasRef.current) {
          const img = new Image();
          img.onload = () => {
            const canvas = vizCanvasRef.current!;
            const maxDim = 640;
            const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            // Create a temporary imageData for the visualization
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            renderProcessingVisualization(canvas, imageData, res);
          };
          img.src = URL.createObjectURL(file);
        }
      }, 100);

      // Auto-speak result
      if (res.text) {
        speak(`Detected: ${res.text}`, true);
      } else {
        speak('No Braille detected in this image. Try a clearer photo.', true);
      }
    } catch (err) {
      setError('Failed to process image. Please try a different file.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [speak]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleSave = useCallback(async () => {
    if (!result) return;
    const ok = await saveScanSession({
      detected_text: result.text,
      braille_cells: result.cells.map(c => c.dots),
      confidence: result.cells.length > 0
        ? result.cells.reduce((s, c) => s + c.confidence, 0) / result.cells.length
        : 0,
      frame_metrics: { blur: result.blur, brightness: result.brightness, angle: result.angle },
      source: 'upload',
    });
    if (ok) setSaved(true);
  }, [result]);

  return (
    <section id="upload" className="py-24 bg-gray-950" aria-label="Upload Braille image">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-4">
            <ImagePlus className="w-3.5 h-3.5" />
            Image Upload
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Upload Braille Photo</h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Upload a photo of embossed Braille paper and the CV pipeline will detect and translate the dots.
          </p>
        </div>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="relative bg-gray-900 rounded-2xl border-2 border-dashed border-white/15 hover:border-cyan-500/40 transition-all cursor-pointer group"
          role="button"
          tabIndex={0}
          aria-label="Click or drag to upload a Braille image"
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
        >
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            {loading ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
                <p className="text-gray-300 font-medium">Processing image...</p>
                <p className="text-gray-600 text-sm">Running CV pipeline (threshold, blob detection, segmentation)</p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mb-4 border border-white/10 group-hover:border-cyan-500/30 transition-all">
                  <Upload className="w-8 h-8 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                </div>
                <p className="text-gray-300 font-semibold mb-1">Drop a Braille photo here</p>
                <p className="text-gray-600 text-sm">or click to browse — JPG, PNG, WebP</p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            aria-hidden="true"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm mt-4" role="alert">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-8 space-y-6">
            {/* Visualization canvas */}
            {previewUrl && (
              <div className="bg-gray-900 rounded-2xl border border-white/10 overflow-hidden">
                <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-300">Detection Visualization</span>
                  <span className="text-xs text-gray-600 font-mono">{result.processingTime.toFixed(0)}ms</span>
                </div>
                <canvas ref={vizCanvasRef} className="w-full" aria-label="Processed image with Braille detection overlays" />
              </div>
            )}

            {/* Detected text */}
            <div className="bg-gray-900 rounded-2xl border border-white/10 p-6">
              <div className="flex items-center gap-2 mb-3">
                {result.text ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                )}
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Detection Result</h3>
              </div>
              {result.text ? (
                <p className="text-3xl font-black text-white tracking-wider mb-4">{result.text}</p>
              ) : (
                <p className="text-gray-500 italic mb-4">No Braille text detected in this image</p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <Stat label="Dots" value={`${result.dots.length}`} />
                <Stat label="Cells" value={`${result.cells.length}`} />
                <Stat label="Sharpness" value={`${Math.round(result.blur * 100)}%`} />
                <Stat label="Brightness" value={`${Math.round(result.brightness)}`} />
              </div>

              {/* Braille cells */}
              {result.cells.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Detected Cells</div>
                  <BrailleCellVisualizer cells={result.cells.map(c => c.dots as BrailleCell)} maxVisible={20} />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => result.text && speak(`Detected: ${result.text}`, true)}
                  disabled={!result.text}
                  className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold text-sm rounded-xl transition-all disabled:opacity-30 shadow-lg shadow-cyan-500/25"
                  aria-label="Read detected text aloud"
                >
                  <Volume2 className="w-4 h-4" />
                  Read Aloud
                  {speaking && <span className="w-1.5 h-1.5 bg-gray-950 rounded-full animate-pulse" />}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saved}
                  className={`flex items-center gap-2 px-5 py-2.5 font-bold text-sm rounded-xl transition-all disabled:opacity-50 ${
                    saved
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
                  }`}
                  aria-label={saved ? 'Already saved' : 'Save to scan history'}
                >
                  {saved ? <CheckCircle className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                  {saved ? 'Saved' : 'Save to History'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2 bg-gray-950 rounded-xl border border-white/5 text-center">
      <div className="text-lg font-black text-cyan-400">{value}</div>
      <div className="text-xs text-gray-600">{label}</div>
    </div>
  );
}
