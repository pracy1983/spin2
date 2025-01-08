import { useState, useEffect } from 'react';
import type { PinnedSuggestion } from './types';

export function useSuggestions(suggestions: string[]) {
  const [visibleSuggestions, setVisibleSuggestions] = useState<PinnedSuggestion[]>([]);

  useEffect(() => {
    const newSuggestions = suggestions
      .filter(suggestion => !visibleSuggestions.some(vs => vs.text === suggestion))
      .map(suggestion => ({ text: suggestion, isPinned: false, highlighted: false }));
    
    const pinnedSuggestions = visibleSuggestions.filter(s => s.isPinned);
    const unpinnedSuggestions = visibleSuggestions.filter(s => !s.isPinned);
    
    setVisibleSuggestions([
      ...pinnedSuggestions,
      ...newSuggestions,
      ...unpinnedSuggestions
    ]);
  }, [suggestions]);

  const handleClose = (index: number) => {
    setVisibleSuggestions(prev => prev.filter((_, i) => i !== index));
  };

  const toggleHighlight = (index: number, event: React.MouseEvent) => {
    if ((event.target as HTMLElement).closest('button[aria-label="Close suggestion"]')) {
      return;
    }

    setVisibleSuggestions(prev => prev.map((suggestion, i) => 
      i === index ? { ...suggestion, highlighted: !suggestion.highlighted } : suggestion
    ));
  };

  const pinHighlightedSuggestions = () => {
    const highlighted = visibleSuggestions.filter(s => s.highlighted && !s.isPinned);
    const notHighlighted = visibleSuggestions.filter(s => !s.highlighted || s.isPinned);
    
    const newPinnedSuggestions = highlighted.map(s => ({
      ...s,
      isPinned: true,
      highlighted: false
    }));

    const existingPinned = notHighlighted.filter(s => s.isPinned);
    const unpinned = notHighlighted.filter(s => !s.isPinned);

    setVisibleSuggestions([
      ...existingPinned,
      ...newPinnedSuggestions,
      ...unpinned
    ]);
  };

  const clearUnpinnedSuggestions = () => {
    setVisibleSuggestions(prev => prev.filter(s => s.isPinned));
  };

  const unpinSuggestion = (index: number) => {
    setVisibleSuggestions(prev => {
      const suggestion = prev[index];
      if (!suggestion.isPinned) return prev;

      const pinnedSuggestions = prev.filter((s, i) => s.isPinned && i !== index);
      const unpinnedSuggestions = prev.filter(s => !s.isPinned);
      
      return [
        ...pinnedSuggestions,
        { ...suggestion, isPinned: false, highlighted: false },
        ...unpinnedSuggestions
      ];
    });
  };

  return {
    visibleSuggestions,
    handleClose,
    toggleHighlight,
    pinHighlightedSuggestions,
    clearUnpinnedSuggestions,
    unpinSuggestion
  };
}