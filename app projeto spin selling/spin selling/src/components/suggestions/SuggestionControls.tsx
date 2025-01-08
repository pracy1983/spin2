import React from 'react';
import { Pin, Trash2 } from 'lucide-react';

interface SuggestionControlsProps {
  onPinHighlighted: () => void;
  onClearUnpinned: () => void;
}

export function SuggestionControls({ onPinHighlighted, onClearUnpinned }: SuggestionControlsProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onPinHighlighted}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-100 text-purple-900 hover:bg-purple-200 border-2 border-purple-400 transition-colors"
      >
        <Pin className="w-4 h-4 fill-current" />
        Fixar selecionadas
      </button>
      <button
        onClick={onClearUnpinned}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        Limpar
      </button>
    </div>
  );
}