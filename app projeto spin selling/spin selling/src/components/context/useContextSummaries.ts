import { useState, useCallback } from 'react';
import { contextManager } from '../../lib/context/context-manager';

interface ContextSummaries {
  guest: string | null;
  podcast: string | null;
}

interface ConfirmationStatus {
  guest: boolean;
  podcast: boolean;
}

export function useContextSummaries() {
  const [summaries, setSummaries] = useState<ContextSummaries>({ guest: null, podcast: null });
  const [confirmed, setConfirmed] = useState<ConfirmationStatus>({ guest: false, podcast: false });

  const updateSummary = useCallback(async (type: 'guest' | 'podcast', files: File[], links: string[]) => {
    try {
      const summary = type === 'guest' 
        ? await contextManager.setGuestContext({ files, links })
        : await contextManager.setPodcastContext({ files, links });

      setSummaries(prev => ({
        ...prev,
        [type]: summary
      }));
      setConfirmed(prev => ({
        ...prev,
        [type]: false
      }));
    } catch (error) {
      console.error(`Error updating ${type} context:`, error);
      throw error;
    }
  }, []);

  const confirmSummary = useCallback((type: 'guest' | 'podcast') => {
    contextManager.confirmContext(type);
    setConfirmed(prev => ({
      ...prev,
      [type]: true
    }));
  }, []);

  return {
    summaries,
    confirmed,
    updateSummary,
    confirmSummary
  };
}