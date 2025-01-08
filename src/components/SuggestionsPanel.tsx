import React, { useRef } from 'react';
import { BrainCircuit, AlertCircle } from 'lucide-react';
import { SuggestionItem } from './suggestions/SuggestionItem';
import { SuggestionControls } from './suggestions/SuggestionControls';
import { useSuggestions } from './suggestions/useSuggestions';

interface SuggestionsPanelProps {
  suggestions: string[];
  error: string | null;
}

export function SuggestionsPanel({ suggestions, error }: SuggestionsPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    visibleSuggestions,
    handleClose,
    toggleHighlight,
    pinHighlightedSuggestions,
    clearUnpinnedSuggestions,
    unpinSuggestion
  } = useSuggestions(suggestions);

  return (
    <div className="w-full lg:w-1/2 p-4 lg:p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-semibold text-gray-800">AI Suggestions</h2>
        </div>
        <SuggestionControls
          onPinHighlighted={pinHighlightedSuggestions}
          onClearUnpinned={clearUnpinnedSuggestions}
        />
      </div>
      <div ref={containerRef} className="h-[calc(50vh-8rem)] lg:h-[calc(100vh-12rem)] overflow-y-auto">
        {error ? (
          <div className="p-4 bg-red-50 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        ) : (
          visibleSuggestions.map((suggestion, index) => (
            <SuggestionItem
              key={index}
              text={suggestion.text}
              isPinned={suggestion.isPinned}
              highlighted={suggestion.highlighted}
              index={index}
              onToggle={toggleHighlight}
              onClose={handleClose}
              onUnpin={unpinSuggestion}
            />
          ))
        )}
      </div>
    </div>
  );
}