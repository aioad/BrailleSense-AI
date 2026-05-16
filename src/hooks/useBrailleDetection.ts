import { useCallback, useEffect, useRef, useState } from 'react';
import { processFrame, type DetectedDot, type BrailleCellResult } from '../utils/imageProcessing';
import { brailleCellsToText, type BrailleCell } from '../utils/brailleMap';

export interface DetectionState {
  isDetecting: boolean;
  detectedText: string;
  confidence: number;
  fps: number;
  guidance: string;
  dots: DetectedDot[];
  cells: BrailleCell[];
  cellResults: BrailleCellResult[];
  blur: number;
  brightness: number;
  processingTime: number;
  frameCount: number;
}

export function useBrailleDetection(videoRef: React.RefObject<HTMLVideoElement>) {
  const [state, setState] = useState<DetectionState>({
    isDetecting: false,
    detectedText: '',
    confidence: 0,
    fps: 0,
    guidance: 'Point camera at Braille text',
    dots: [],
    cells: [],
    cellResults: [],
    blur: 0.8,
    brightness: 128,
    processingTime: 0,
    frameCount: 0,
  });

  const animFrameRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const lastTimeRef = useRef<number>(0);
  const fpsCountRef = useRef<number>(0);
  const fpsTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);
  const processingRef = useRef<boolean>(false);

  const processVideoFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(processVideoFrame);
      return;
    }

    const now = performance.now();

    // Skip if still processing previous frame
    if (processingRef.current) {
      animFrameRef.current = requestAnimationFrame(processVideoFrame);
      return;
    }

    // Process every ~150ms for performance (6-7fps processing)
    if (now - lastTimeRef.current < 150) {
      animFrameRef.current = requestAnimationFrame(processVideoFrame);
      return;
    }
    lastTimeRef.current = now;

    processingRef.current = true;

    try {
      const canvas = canvasRef.current;
      // Use smaller resolution for faster processing
      const maxDim = 320;
      const scale = Math.min(1, maxDim / Math.max(video.videoWidth || 320, video.videoHeight || 240));
      const w = Math.round((video.videoWidth || 320) * scale);
      const h = Math.round((video.videoHeight || 240) * scale);
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) { processingRef.current = false; return; }

      ctx.drawImage(video, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);

      // Run the real processing pipeline
      const result = processFrame(imageData);

      // FPS calculation
      fpsCountRef.current++;
      frameCountRef.current++;

      if (now - fpsTimeRef.current >= 1000) {
        const fps = fpsCountRef.current;
        fpsCountRef.current = 0;
        fpsTimeRef.current = now;

        // Convert cell results to BrailleCell format
        const cells: BrailleCell[] = result.cells.map(c => c.dots as BrailleCell);
        const text = result.text || brailleCellsToText(cells);
        const confidence = result.cells.length > 0
          ? result.cells.reduce((sum, c) => sum + c.confidence, 0) / result.cells.length
          : 0;

        setState(prev => ({
          ...prev,
          fps,
          blur: result.blur,
          brightness: result.brightness,
          guidance: result.guidance,
          detectedText: text,
          cells,
          cellResults: result.cells,
          confidence,
          dots: result.dots,
          processingTime: result.processingTime,
          frameCount: frameCountRef.current,
        }));
      }
    } catch (err) {
      console.error('Frame processing error:', err);
    }

    processingRef.current = false;
    animFrameRef.current = requestAnimationFrame(processVideoFrame);
  }, [videoRef]);

  const startDetection = useCallback(() => {
    setState(prev => ({ ...prev, isDetecting: true }));
    lastTimeRef.current = 0;
    fpsCountRef.current = 0;
    fpsTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(processVideoFrame);
  }, [processVideoFrame]);

  const stopDetection = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    processingRef.current = false;
    setState(prev => ({ ...prev, isDetecting: false }));
  }, []);

  useEffect(() => {
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  return { state, startDetection, stopDetection };
}
