import { useState, useCallback } from 'react';
import { ArrowLeft, Check, RotateCcw, PenLine } from 'lucide-react';
import { textToBrailleCells, brailleCellsToText, type BrailleCell } from '../utils/brailleMap';

// Braille dot positions: 1=top-left, 2=mid-left, 3=bot-left, 4=top-right, 5=mid-right, 6=bot-right
const DOT_LABELS = [
  { index: 0, label: '1', row: 0, col: 0 },
  { index: 1, label: '2', row: 1, col: 0 },
  { index: 2, label: '3', row: 2, col: 0 },
  { index: 3, label: '4', row: 0, col: 1 },
  { index: 4, label: '5', row: 1, col: 1 },
  { index: 5, label: '6', row: 2, col: 1 },
];

interface Props {
  onCellComplete?: (cell: BrailleCell, char: string) => void;
  onTextChange?: (text: string, cells: BrailleCell[]) => void;
}

export default function BrailleInputPad({ onCellComplete, onTextChange }: Props) {
  const [currentCell, setCurrentCell] = useState<BrailleCell>([0, 0, 0, 0, 0, 0]);
  const [cells, setCells] = useState<BrailleCell[]>([]);
  const [mode, setMode] = useState<'letter' | 'number' | 'capital'>('letter');

  const toggleDot = useCallback((index: number) => {
    setCurrentCell(prev => {
      const next = [...prev] as BrailleCell;
      next[index] = next[index] === 0 ? 1 : 0;
      return next;
    });
  }, []);

  const confirmCell = useCallback(() => {
    let newCells = [...cells];

    // Add mode indicators
    if (mode === 'number') {
      newCells.push([0, 0, 1, 1, 1, 1]); // number indicator
    }
    if (mode === 'capital') {
      newCells.push([0, 0, 0, 0, 0, 1]); // capital indicator
    }

    newCells.push(currentCell);
    setCells(newCells);
    setCurrentCell([0, 0, 0, 0, 0, 0]);

    const text = brailleCellsToText(newCells);
    onCellComplete?.(currentCell, text);
    onTextChange?.(text, newCells);
  }, [currentCell, cells, mode, onCellComplete, onTextChange]);

  const deleteLast = useCallback(() => {
    const newCells = cells.slice(0, -1);
    setCells(newCells);
    const text = brailleCellsToText(newCells);
    onTextChange?.(text, newCells);
  }, [cells, onTextChange]);

  const clearAll = useCallback(() => {
    setCells([]);
    setCurrentCell([0, 0, 0, 0, 0, 0]);
    setMode('letter');
    onTextChange?.('', []);
  }, [onTextChange]);

  const addSpace = useCallback(() => {
    const newCells = [...cells, [0, 0, 0, 0, 0, 0] as BrailleCell];
    setCells(newCells);
    const text = brailleCellsToText(newCells);
    onTextChange?.(text, newCells);
  }, [cells, onTextChange]);

  const text = brailleCellsToText(cells);

  return (
    <section id="input-pad" className="py-24 bg-gray-900" aria-label="Braille input pad">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-xs font-semibold uppercase tracking-widest mb-4">
            <PenLine className="w-3.5 h-3.5" />
            Manual Input
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Braille Input Pad</h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Tap dots to build Braille cells manually. Learn Braille patterns and see text form in real time.
          </p>
        </div>

        <div className="space-y-5">
      <div className="bg-gray-900 rounded-2xl border border-white/10 p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Output</span>
          <div className="flex items-center gap-2">
            {mode !== 'letter' && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                mode === 'number' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' :
                'bg-blue-500/15 text-blue-400 border border-blue-500/30'
              }`}>
                {mode === 'number' ? '# Number' : '^ Capital'}
              </span>
            )}
            <span className="text-xs text-gray-600 font-mono">{cells.length} cells</span>
          </div>
        </div>
        <div className="min-h-12 flex items-center">
          {text ? (
            <p className="text-2xl font-black text-white tracking-wider">{text}</p>
          ) : (
            <p className="text-gray-600 text-sm italic">Tap dots below to build Braille cells</p>
          )}
        </div>
      </div>

      {/* Current cell display */}
      <div className="flex items-center justify-center gap-6">
        <div className="bg-gray-900 rounded-2xl border border-white/10 p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 text-center">Current Cell</div>
          <div className="grid grid-cols-2 gap-3">
            {DOT_LABELS.map(({ index, label }) => (
              <button
                key={index}
                onClick={() => toggleDot(index)}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-150 border-2 ${
                  currentCell[index]
                    ? 'bg-cyan-500 border-cyan-400 shadow-lg shadow-cyan-500/30 scale-105'
                    : 'bg-gray-800 border-gray-700 hover:border-gray-500 hover:bg-gray-750'
                }`}
                aria-label={`Dot ${label}: ${currentCell[index] ? 'raised' : 'flat'}`}
                aria-pressed={currentCell[index] === 1}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <div className={`w-5 h-5 rounded-full transition-all ${
                    currentCell[index] ? 'bg-white shadow-md' : 'bg-gray-700 border border-gray-600'
                  }`} />
                  <span className={`text-xs font-bold ${currentCell[index] ? 'text-white' : 'text-gray-600'}`}>
                    {label}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mode buttons */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <button
          onClick={() => setMode(mode === 'number' ? 'letter' : 'number')}
          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
            mode === 'number'
              ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
              : 'bg-gray-900 text-gray-400 border-white/10 hover:border-white/20'
          }`}
          aria-pressed={mode === 'number'}
        >
          # Number
        </button>
        <button
          onClick={() => setMode(mode === 'capital' ? 'letter' : 'capital')}
          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
            mode === 'capital'
              ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
              : 'bg-gray-900 text-gray-400 border-white/10 hover:border-white/20'
          }`}
          aria-pressed={mode === 'capital'}
        >
          ^ Capital
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <button
          onClick={confirmCell}
          disabled={currentCell.every(d => d === 0)}
          className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold text-sm rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/25"
          aria-label="Confirm current cell"
        >
          <Check className="w-4 h-4" />
          Add Cell
        </button>
        <button
          onClick={addSpace}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 font-semibold text-sm rounded-xl border border-white/10 transition-all"
          aria-label="Add space"
        >
          Space
        </button>
        <button
          onClick={deleteLast}
          disabled={cells.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 font-semibold text-sm rounded-xl border border-white/10 transition-all disabled:opacity-30"
          aria-label="Delete last cell"
        >
          <ArrowLeft className="w-4 h-4" />
          Delete
        </button>
        <button
          onClick={clearAll}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold text-sm rounded-xl border border-red-500/20 transition-all"
          aria-label="Clear all cells"
        >
          <RotateCcw className="w-4 h-4" />
          Clear
        </button>
      </div>

      {/* Quick type: common words */}
      <div className="bg-gray-900 rounded-2xl border border-white/10 p-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Type</div>
        <div className="flex flex-wrap gap-2">
          {['hello', 'the', 'and', 'for', 'is', 'in', 'it', 'you', 'that', 'braille', 'world', 'help'].map(word => (
            <button
              key={word}
              onClick={() => {
                const wordCells = textToBrailleCells(word);
                const newCells = [...cells, ...wordCells];
                setCells(newCells);
                const t = brailleCellsToText(newCells);
                onTextChange?.(t, newCells);
              }}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-medium rounded-lg border border-white/10 hover:border-white/20 transition-all"
            >
              {word}
            </button>
          ))}
        </div>
      </div>
      </div>
      </div>
    </section>
  );
}
