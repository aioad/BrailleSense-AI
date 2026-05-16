import type { BrailleCell } from '../utils/brailleMap';
import { BRAILLE_ALPHABET } from '../utils/brailleMap';

interface Props {
  cells: BrailleCell[];
  maxVisible?: number;
}

// Interactive Braille cell display
export default function BrailleCellVisualizer({ cells, maxVisible = 14 }: Props) {
  const visible = cells.slice(0, maxVisible);

  // Reverse lookup for character label
  const cellToLetter = (cell: BrailleCell): string => {
    const key = cell.join('');
    for (const [ch, c] of Object.entries(BRAILLE_ALPHABET)) {
      if (c.join('') === key) return ch.toUpperCase();
    }
    return '?';
  };

  if (cells.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 text-gray-600 text-sm italic">
        No cells detected yet
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3" role="list" aria-label="Detected Braille cells">
      {visible.map((cell, i) => (
        <div
          key={i}
          className="flex flex-col items-center gap-1.5"
          role="listitem"
          aria-label={`Cell ${i + 1}: ${cellToLetter(cell)}`}
        >
          <div className="grid grid-cols-2 gap-1 p-2 bg-gray-800 rounded-lg border border-white/10">
            {cell.map((active, di) => (
              <div
                key={di}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                  active
                    ? 'bg-cyan-400 shadow-lg shadow-cyan-400/40'
                    : 'bg-gray-700 border border-gray-600'
                }`}
                aria-hidden="true"
              />
            ))}
          </div>
          <span className="text-xs font-bold text-gray-400">{cellToLetter(cell)}</span>
        </div>
      ))}
      {cells.length > maxVisible && (
        <div className="flex items-center text-xs text-gray-600 font-medium">
          +{cells.length - maxVisible} more
        </div>
      )}
    </div>
  );
}
