export type BrailleCell = [number, number, number, number, number, number];

// Grade 1 Braille: dot positions 1-6 mapped to array index 0-5
// Layout:
//  1 4
//  2 5
//  3 6
export const BRAILLE_ALPHABET: Record<string, BrailleCell> = {
  a: [1, 0, 0, 0, 0, 0],
  b: [1, 1, 0, 0, 0, 0],
  c: [1, 0, 0, 1, 0, 0],
  d: [1, 0, 0, 1, 1, 0],
  e: [1, 0, 0, 0, 1, 0],
  f: [1, 1, 0, 1, 0, 0],
  g: [1, 1, 0, 1, 1, 0],
  h: [1, 1, 0, 0, 1, 0],
  i: [0, 1, 0, 1, 0, 0],
  j: [0, 1, 0, 1, 1, 0],
  k: [1, 0, 1, 0, 0, 0],
  l: [1, 1, 1, 0, 0, 0],
  m: [1, 0, 1, 1, 0, 0],
  n: [1, 0, 1, 1, 1, 0],
  o: [1, 0, 1, 0, 1, 0],
  p: [1, 1, 1, 1, 0, 0],
  q: [1, 1, 1, 1, 1, 0],
  r: [1, 1, 1, 0, 1, 0],
  s: [0, 1, 1, 1, 0, 0],
  t: [0, 1, 1, 1, 1, 0],
  u: [1, 0, 1, 0, 0, 1],
  v: [1, 1, 1, 0, 0, 1],
  w: [0, 1, 0, 1, 1, 1],
  x: [1, 0, 1, 1, 0, 1],
  y: [1, 0, 1, 1, 1, 1],
  z: [1, 0, 1, 0, 1, 1],
  ' ': [0, 0, 0, 0, 0, 0],
};

export const BRAILLE_NUMBERS: Record<string, BrailleCell> = {
  '1': [1, 0, 0, 0, 0, 0],
  '2': [1, 1, 0, 0, 0, 0],
  '3': [1, 0, 0, 1, 0, 0],
  '4': [1, 0, 0, 1, 1, 0],
  '5': [1, 0, 0, 0, 1, 0],
  '6': [1, 1, 0, 1, 0, 0],
  '7': [1, 1, 0, 1, 1, 0],
  '8': [1, 1, 0, 0, 1, 0],
  '9': [0, 1, 0, 1, 0, 0],
  '0': [0, 1, 0, 1, 1, 0],
};

// number indicator prefix cell
export const NUMBER_INDICATOR: BrailleCell = [0, 0, 1, 1, 1, 1];
// capital indicator prefix cell
export const CAPITAL_INDICATOR: BrailleCell = [0, 0, 0, 0, 0, 1];

// Reverse lookup: pattern key -> character
function cellKey(cell: BrailleCell): string {
  return cell.join('');
}

const REVERSE_MAP: Record<string, string> = {};
for (const [char, cell] of Object.entries(BRAILLE_ALPHABET)) {
  REVERSE_MAP[cellKey(cell)] = char;
}

const REVERSE_NUMBERS: Record<string, string> = {};
for (const [digit, cell] of Object.entries(BRAILLE_NUMBERS)) {
  REVERSE_NUMBERS[cellKey(cell)] = digit;
}

export function cellToChar(cell: BrailleCell, numberMode = false, capitalMode = false): string {
  const key = cellKey(cell);
  if (numberMode) {
    return REVERSE_NUMBERS[key] ?? '?';
  }
  const char = REVERSE_MAP[key] ?? '?';
  return capitalMode ? char.toUpperCase() : char;
}

export function textToBrailleCells(text: string): BrailleCell[] {
  const cells: BrailleCell[] = [];
  let numberMode = false;
  for (const char of text.toLowerCase()) {
    if (/[0-9]/.test(char)) {
      if (!numberMode) {
        cells.push(NUMBER_INDICATOR);
        numberMode = true;
      }
      cells.push(BRAILLE_NUMBERS[char] ?? [0, 0, 0, 0, 0, 0]);
    } else {
      numberMode = false;
      cells.push(BRAILLE_ALPHABET[char] ?? [0, 0, 0, 0, 0, 0]);
    }
  }
  return cells;
}

export function brailleCellsToText(cells: BrailleCell[]): string {
  let result = '';
  let numberMode = false;
  let capitalMode = false;

  for (const cell of cells) {
    const key = cellKey(cell);
    if (key === cellKey(NUMBER_INDICATOR)) {
      numberMode = true;
      continue;
    }
    if (key === cellKey(CAPITAL_INDICATOR)) {
      capitalMode = true;
      continue;
    }
    const char = cellToChar(cell, numberMode, capitalMode);
    result += char;
    capitalMode = false;
    if (char === ' ') numberMode = false;
  }
  return result;
}

// Simulate dot detection from a grayscale image patch (for demo canvas rendering)
export function simulateDetection(input: string): {
  cells: BrailleCell[];
  text: string;
  confidence: number;
} {
  const cells = textToBrailleCells(input);
  const text = brailleCellsToText(cells);
  return { cells, text, confidence: 0.92 + Math.random() * 0.07 };
}
