import React from 'react';
import { X, Pin } from 'lucide-react';
import { clsx } from 'clsx';
import { SpinPhase } from '../../lib/spin/types';
import { SPIN_PHASES } from '../../lib/spin/spin-config';

interface SuggestionItemProps {
  text: string;
  isPinned: boolean;
  highlighted: boolean;
  index: number;
  onToggle: (index: number, event: React.MouseEvent) => void;
  onClose: (index: number) => void;
  onUnpin: (index: number) => void;
}

export function SuggestionItem({
  text,
  isPinned,
  highlighted,
  index,
  onToggle,
  onClose,
  onUnpin
}: SuggestionItemProps) {
  // Extract SPIN phase from the text
  const match = typeof text === 'string' ? text.match(/^\[(SITUATION|PROBLEM|IMPLICATION|NEED_PAYOFF)\]/) : null;
  const phase = match ? match[1] as SpinPhase : null;
  const cleanText = typeof text === 'string' ? text.replace(/^\[.*?\]\s*/, '') : text;

  const getPhaseColor = (phase: SpinPhase | null) => {
    if (!phase) return "bg-gray-500 text-white ring-2 ring-gray-300";
    
    switch (phase) {
      case 'SITUATION':
        return "bg-blue-500 text-white ring-2 ring-blue-300";
      case 'PROBLEM':
        return "bg-yellow-500 text-white ring-2 ring-yellow-300";
      case 'IMPLICATION':
        return "bg-orange-500 text-white ring-2 ring-orange-300";
      case 'NEED_PAYOFF':
        return "bg-green-500 text-white ring-2 ring-green-300";
      default:
        return "bg-gray-500 text-white ring-2 ring-gray-300";
    }
  };

  const getPhaseBackground = (phase: SpinPhase | null) => {
    if (!phase) return "bg-gray-50 hover:bg-gray-100";
    
    switch (phase) {
      case 'SITUATION':
        return "bg-blue-50 hover:bg-blue-100";
      case 'PROBLEM':
        return "bg-yellow-50 hover:bg-yellow-100";
      case 'IMPLICATION':
        return "bg-orange-50 hover:bg-orange-100";
      case 'NEED_PAYOFF':
        return "bg-green-50 hover:bg-green-100";
      default:
        return "bg-gray-50 hover:bg-gray-100";
    }
  };

  return (
    <div
      className={clsx(
        'relative flex items-start gap-2 rounded-lg p-2 transition-colors cursor-pointer group',
        getPhaseBackground(phase),
        highlighted && 'ring-2 ring-blue-500'
      )}
      onClick={(e) => onToggle(index, e)}
    >
      {phase && (
        <div className={clsx(
          'flex-shrink-0 rounded px-2 py-1 text-xs font-medium',
          getPhaseColor(phase)
        )}>
          {SPIN_PHASES[phase].label}
        </div>
      )}
      
      <div className="flex-grow text-sm text-gray-700">
        {cleanText}
      </div>

      <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {isPinned ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUnpin(index);
            }}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <Pin className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose(index);
            }}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}