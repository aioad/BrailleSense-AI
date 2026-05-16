// Real canvas-based image processing pipeline for Braille dot detection
// This runs entirely in the browser using Canvas API + pixel manipulation

export interface DetectedDot {
  x: number;
  y: number;
  radius: number;
  confidence: number;
}

export interface BrailleCellResult {
  dots: number[]; // 6-element binary array [d1,d2,d3,d4,d5,d6]
  cx: number;
  cy: number;
  char: string;
  confidence: number;
}

export interface ProcessingResult {
  dots: DetectedDot[];
  cells: BrailleCellResult[];
  text: string;
  blur: number;
  brightness: number;
  angle: number;
  guidance: string;
  processingTime: number;
}

export interface FrameMetrics {
  blur: number;
  brightness: number;
  angle: number;
}

// ---- Grayscale conversion ----
export function toGrayscale(imageData: ImageData): Float32Array {
  const { data, width, height } = imageData;
  const gray = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
  }
  return gray;
}

// ---- CLAHE-like local histogram equalization (simplified) ----
export function localContrastEnhance(gray: Float32Array, width: number, height: number, tileSize = 32): Float32Array {
  const result = new Float32Array(gray.length);

  for (let ty = 0; ty < height; ty += tileSize) {
    for (let tx = 0; tx < width; tx += tileSize) {
      // Compute local stats
      let min = 255, max = 0;
      const endY = Math.min(ty + tileSize, height);
      const endX = Math.min(tx + tileSize, width);

      for (let y = ty; y < endY; y++) {
        for (let x = tx; x < endX; x++) {
          const v = gray[y * width + x];
          if (v < min) min = v;
          if (v > max) max = v;
        }
      }

      const range = max - min || 1;
      for (let y = ty; y < endY; y++) {
        for (let x = tx; x < endX; x++) {
          result[y * width + x] = ((gray[y * width + x] - min) / range) * 255;
        }
      }
    }
  }
  return result;
}

// ---- Gaussian blur (3x3) ----
export function gaussianBlur(gray: Float32Array, width: number, height: number): Float32Array {
  const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
  const kSum = 16;
  const result = new Float32Array(gray.length);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sum = 0;
      let ki = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          sum += gray[(y + dy) * width + (x + dx)] * kernel[ki++];
        }
      }
      result[y * width + x] = sum / kSum;
    }
  }
  return result;
}

// ---- Adaptive threshold (Gaussian-weighted local mean) ----
export function adaptiveThreshold(gray: Float32Array, width: number, height: number, blockSize = 15, C = 10): Uint8ClampedArray {
  const result = new Uint8ClampedArray(width * height);
  const half = Math.floor(blockSize / 2);

  // Compute integral image for fast local mean
  const integral = new Float64Array((width + 1) * (height + 1));
  for (let y = 0; y < height; y++) {
    let rowSum = 0;
    for (let x = 0; x < width; x++) {
      rowSum += gray[y * width + x];
      integral[(y + 1) * (width + 1) + (x + 1)] = rowSum + integral[y * (width + 1) + (x + 1)];
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const y1 = Math.max(0, y - half);
      const y2 = Math.min(height - 1, y + half);
      const x1 = Math.max(0, x - half);
      const x2 = Math.min(width - 1, x + half);

      const count = (x2 - x1 + 1) * (y2 - y1 + 1);
      const sum =
        integral[(y2 + 1) * (width + 1) + (x2 + 1)] -
        integral[y1 * (width + 1) + (x2 + 1)] -
        integral[(y2 + 1) * (width + 1) + x1] +
        integral[y1 * (width + 1) + x1];

      const localMean = sum / count;
      // For Braille: dots are typically darker than background on light paper
      // Invert: mark dark spots as 255 (foreground)
      result[y * width + x] = gray[y * width + x] < localMean - C ? 255 : 0;
    }
  }
  return result;
}

// ---- Morphological erosion ----
export function erode(mask: Uint8ClampedArray, width: number, height: number, kernelSize = 2): Uint8ClampedArray {
  const result = new Uint8ClampedArray(mask.length);
  const half = Math.floor(kernelSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let allSet = true;
      outer: for (let dy = -half; dy <= half; dy++) {
        for (let dx = -half; dx <= half; dx++) {
          const ny = y + dy, nx = x + dx;
          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
            if (mask[ny * width + nx] === 0) { allSet = false; break outer; }
          }
        }
      }
      result[y * width + x] = allSet ? 255 : 0;
    }
  }
  return result;
}

// ---- Morphological dilation ----
export function dilate(mask: Uint8ClampedArray, width: number, height: number, kernelSize = 3): Uint8ClampedArray {
  const result = new Uint8ClampedArray(mask.length);
  const half = Math.floor(kernelSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let anySet = false;
      for (let dy = -half; dy <= half && !anySet; dy++) {
        for (let dx = -half; dx <= half && !anySet; dx++) {
          const ny = y + dy, nx = x + dx;
          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
            if (mask[ny * width + nx] > 0) anySet = true;
          }
        }
      }
      result[y * width + x] = anySet ? 255 : 0;
    }
  }
  return result;
}

// ---- Connected component labeling (BFS flood fill) ----
export interface Blob {
  cx: number;
  cy: number;
  area: number;
  minX: number; maxX: number; minY: number; maxY: number;
  circularity: number;
}

export function findBlobs(mask: Uint8ClampedArray, width: number, height: number, minArea = 4): Blob[] {
  const visited = new Uint8Array(width * height);
  const blobs: Blob[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (mask[idx] === 0 || visited[idx]) continue;

      // BFS
      const queue: number[] = [idx];
      visited[idx] = 1;
      let sumX = 0, sumY = 0, count = 0;
      let minX = x, maxX = x, minY = y, maxY = y;

      while (queue.length > 0) {
        const ci = queue.shift()!;
        const cx = ci % width;
        const cy = Math.floor(ci / width);
        sumX += cx; sumY += cy; count++;
        if (cx < minX) minX = cx; if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy; if (cy > maxY) maxY = cy;

        const neighbors = [
          [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1],
          [cx + 1, cy + 1], [cx - 1, cy - 1], [cx + 1, cy - 1], [cx - 1, cy + 1]
        ];
        for (const [nx, ny] of neighbors) {
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const ni = ny * width + nx;
            if (mask[ni] > 0 && !visited[ni]) {
              visited[ni] = 1;
              queue.push(ni);
            }
          }
        }
      }

      if (count < minArea) continue;

      const bboxW = maxX - minX + 1;
      const bboxH = maxY - minY + 1;
      const expectedArea = Math.PI * (bboxW / 2) * (bboxH / 2);
      const circularity = expectedArea > 0 ? count / expectedArea : 0;

      blobs.push({
        cx: sumX / count,
        cy: sumY / count,
        area: count,
        minX, maxX, minY, maxY,
        circularity
      });
    }
  }
  return blobs;
}

// ---- Filter blobs to identify Braille dots ----
export function filterBrailleDots(blobs: Blob[], imageWidth: number, imageHeight: number): DetectedDot[] {
  const dots: DetectedDot[] = [];
  const minArea = Math.max(4, imageWidth * imageHeight * 0.00005);
  const maxArea = imageWidth * imageHeight * 0.008;

  for (const blob of blobs) {
    if (blob.area < minArea || blob.area > maxArea) continue;

    const bboxW = blob.maxX - blob.minX + 1;
    const bboxH = blob.maxY - blob.minY + 1;
    const aspectRatio = bboxW / (bboxH || 1);

    // Dots should be roughly circular (0.4 < AR < 2.5)
    if (aspectRatio < 0.35 || aspectRatio > 2.8) continue;

    // Circularity check (0.3 to 1.5 for real dots)
    if (blob.circularity < 0.25 || blob.circularity > 1.8) continue;

    const radius = (bboxW + bboxH) / 4;
    const confidence = Math.min(1, 0.3 + blob.circularity * 0.4 + (1 - Math.abs(aspectRatio - 1) * 0.3));

    dots.push({
      x: blob.cx,
      y: blob.cy,
      radius: Math.max(2, radius),
      confidence: Math.max(0, Math.min(1, confidence))
    });
  }

  // Sort by position (left-to-right, top-to-bottom)
  dots.sort((a, b) => a.y - b.y || a.x - b.x);
  return dots;
}

// ---- Group dots into Braille cells (2 cols x 3 rows) ----
export function groupDotsIntoCells(dots: DetectedDot[]): BrailleCellResult[] {
  if (dots.length < 1) return [];

  // Estimate inter-dot spacing using nearest-neighbor distances
  const distances: number[] = [];
  for (let i = 0; i < dots.length; i++) {
    let minDist = Infinity;
    for (let j = 0; j < dots.length; j++) {
      if (i === j) continue;
      const dx = dots[i].x - dots[j].x;
      const dy = dots[i].y - dots[j].y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < minDist) minDist = d;
    }
    if (minDist < Infinity) distances.push(minDist);
  }

  if (distances.length === 0) return [];

  distances.sort((a, b) => a - b);
  const medianDist = distances[Math.floor(distances.length / 2)];

  // Cell dimensions: horizontal spacing ~ 1.5x dot spacing, vertical ~ 2.5x
  const cellWidth = medianDist * 2.5;
  const cellHeight = medianDist * 3.5;

  if (cellWidth < 5 || cellHeight < 5) return [];

  // Find grid origin (top-left of first cell)
  const originX = Math.min(...dots.map(d => d.x));
  const originY = Math.min(...dots.map(d => d.y));

  // Assign dots to cell grid positions
  const cellMap = new Map<string, { dots: number[]; cx: number; cy: number; count: number }>();

  for (const dot of dots) {
    const relX = dot.x - originX;
    const relY = dot.y - originY;

    const cellCol = Math.round(relX / cellWidth);
    const cellRow = Math.round(relY / cellHeight);
    const key = `${cellRow}_${cellCol}`;

    if (!cellMap.has(key)) {
      cellMap.set(key, { dots: [0, 0, 0, 0, 0, 0], cx: 0, cy: 0, count: 0 });
    }
    const cell = cellMap.get(key)!;
    cell.cx += dot.x;
    cell.cy += dot.y;
    cell.count++;

    // Determine which of the 6 positions this dot occupies
    const localX = relX - cellCol * cellWidth;
    const localY = relY - cellRow * cellHeight;

    const dotCol = localX < cellWidth * 0.4 ? 0 : 1; // left=0, right=1
    const dotRow = localY < cellHeight * 0.33 ? 0 : localY < cellHeight * 0.67 ? 1 : 2; // top=0, mid=1, bot=2

    // Map to Braille dot positions: 1=top-left, 2=mid-left, 3=bot-left, 4=top-right, 5=mid-right, 6=bot-right
    const dotIndex = dotCol === 0 ? dotRow : dotRow + 3;
    cell.dots[dotIndex] = 1;
  }

  // Convert to results
  const results: BrailleCellResult[] = [];
  const entries = Array.from(cellMap.entries()).sort((a, b) => {
    const [ar, ac] = a[0].split('_').map(Number);
    const [br, bc] = b[0].split('_').map(Number);
    return ar - br || ac - bc;
  });

  for (const [, cell] of entries) {
    const char = cellToCharLookup(cell.dots);
    results.push({
      dots: cell.dots,
      cx: cell.cx / cell.count,
      cy: cell.cy / cell.count,
      char,
      confidence: cell.count >= 1 ? 0.85 : 0.5
    });
  }

  return results;
}

// ---- Braille cell to character lookup ----
const BRAILLE_LOOKUP: Record<string, string> = {
  '100000': 'a', '110000': 'b', '100100': 'c', '100110': 'd', '100010': 'e',
  '110100': 'f', '110110': 'g', '110010': 'h', '010100': 'i', '010110': 'j',
  '101000': 'k', '111000': 'l', '101100': 'm', '101110': 'n', '101010': 'o',
  '111100': 'p', '111110': 'q', '111010': 'r', '011100': 's', '011110': 't',
  '101001': 'u', '111001': 'v', '010111': 'w', '101101': 'x', '101111': 'y',
  '101011': 'z', '000000': ' ',
};

function cellToCharLookup(dots: number[]): string {
  const key = dots.join('');
  return BRAILLE_LOOKUP[key] ?? '?';
}

// ---- Blur detection (Laplacian variance) ----
export function computeBlurScore(imageData: ImageData): number {
  const { data, width, height } = imageData;
  let sum = 0;
  let sumSq = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y += 2) {
    for (let x = 1; x < width - 1; x += 2) {
      const idx = (y * width + x) * 4;
      const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];

      const idxL = (y * width + (x - 1)) * 4;
      const idxR = (y * width + (x + 1)) * 4;
      const idxU = ((y - 1) * width + x) * 4;
      const idxD = ((y + 1) * width + x) * 4;

      const gL = 0.299 * data[idxL] + 0.587 * data[idxL + 1] + 0.114 * data[idxL + 2];
      const gR = 0.299 * data[idxR] + 0.587 * data[idxR + 1] + 0.114 * data[idxR + 2];
      const gU = 0.299 * data[idxU] + 0.587 * data[idxU + 1] + 0.114 * data[idxU + 2];
      const gD = 0.299 * data[idxD] + 0.587 * data[idxD + 1] + 0.114 * data[idxD + 2];

      const laplacian = Math.abs(4 * gray - gL - gR - gU - gD);
      sum += laplacian;
      sumSq += laplacian * laplacian;
      count++;
    }
  }

  const mean = sum / count;
  const variance = (sumSq / count) - (mean * mean);
  // Normalize: higher variance = sharper. Returns 0-1 sharpness score
  return Math.min(1, Math.sqrt(variance) / 25);
}

// ---- Brightness calculation ----
export function computeBrightness(imageData: ImageData): number {
  const { data } = imageData;
  let sum = 0;
  const step = 16;
  let count = 0;
  for (let i = 0; i < data.length; i += 4 * step) {
    sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    count++;
  }
  return sum / count;
}

// ---- Smart camera guidance ----
export function generateGuidance(metrics: FrameMetrics, hasDots: boolean): string {
  if (metrics.brightness < 40) return 'Lighting too low — move to a brighter area or enable flash';
  if (metrics.brightness > 230) return 'Overexposed — reduce glare or move away from direct light';
  if (metrics.blur < 0.15) return 'Image too blurry — hold camera steady and refocus';
  if (Math.abs(metrics.angle) > 25) return `Tilt camera ${metrics.angle > 0 ? 'left' : 'right'} slightly`;
  if (metrics.brightness < 80) return 'Low light detected — try turning on flash';
  if (hasDots) return 'Braille detected — hold steady for best results';
  return 'Point camera at Braille text on paper';
}

// ---- Full processing pipeline ----
export function processFrame(imageData: ImageData): ProcessingResult {
  const startTime = performance.now();
  const { width, height } = imageData;

  // Step 1: Grayscale
  const gray = toGrayscale(imageData);

  // Step 2: Local contrast enhancement (CLAHE-like)
  const enhanced = localContrastEnhance(gray, width, height, 32);

  // Step 3: Gaussian blur to reduce noise
  const blurred = gaussianBlur(enhanced, width, height);

  // Step 4: Adaptive threshold
  const threshold = adaptiveThreshold(blurred, width, height, 15, 10);

  // Step 5: Morphological open (erode then dilate) to clean noise
  const eroded = erode(threshold, width, height, 2);
  const cleaned = dilate(eroded, width, height, 3);

  // Step 6: Find blobs (connected components)
  const blobs = findBlobs(cleaned, width, height, 4);

  // Step 7: Filter to Braille dot candidates
  const dots = filterBrailleDots(blobs, width, height);

  // Step 8: Group dots into cells
  const cells = groupDotsIntoCells(dots);

  // Step 9: Assemble text
  const text = cells.map(c => c.char).join('');

  // Frame metrics
  const blur = computeBlurScore(imageData);
  const brightness = computeBrightness(imageData);
  const angle = 0; // Would need Hough lines for real angle estimation

  const guidance = generateGuidance({ blur, brightness, angle }, dots.length > 0);
  const processingTime = performance.now() - startTime;

  return {
    dots,
    cells,
    text,
    blur,
    brightness,
    angle,
    guidance,
    processingTime
  };
}

// ---- Process an uploaded image file ----
export async function processImageFile(file: File): Promise<ProcessingResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Scale down for performance
      const maxDim = 640;
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) { reject(new Error('Canvas context failed')); return; }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = processFrame(imageData);
      resolve(result);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

// ---- Render processing visualization to a canvas ----
export function renderProcessingVisualization(
  canvas: HTMLCanvasElement,
  imageData: ImageData,
  result: ProcessingResult
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { width, height } = imageData;
  canvas.width = width;
  canvas.height = height;

  // Draw original image
  ctx.putImageData(imageData, 0, 0);

  // Draw detected dots
  for (const dot of result.dots) {
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, dot.radius + 2, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(34, 211, 238, ${dot.confidence})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(34, 211, 238, 0.2)`;
    ctx.fill();
  }

  // Draw cell boundaries
  for (const cell of result.cells) {
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(cell.cx - 15, cell.cy - 20, 30, 40);
    ctx.setLineDash([]);

    // Label
    ctx.fillStyle = 'rgba(52, 211, 153, 0.9)';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(cell.char.toUpperCase(), cell.cx, cell.cy + 30);
  }
}
