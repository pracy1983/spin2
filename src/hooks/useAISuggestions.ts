import { useState, useRef, useCallback } from 'react';
import { deepseekManager } from '../lib/deepseek';

const THROTTLE_INTERVAL = 2000; // 2 seconds between requests
const MAX_RETRIES = 3;

export function useAISuggestions() {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const processedTexts = useRef(new Set<string>());
  const lastRequestTime = useRef<number>(0);
  const retryCount = useRef<number>(0);

  const generateSuggestions = useCallback(async (text: string) => {
    if (!text.trim() || isProcessing) return;
    
    // Check if this exact text has been processed before
    if (processedTexts.current.has(text.trim())) {
      return;
    }

    // Implement throttling
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime.current;
    if (timeSinceLastRequest < THROTTLE_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, THROTTLE_INTERVAL - timeSinceLastRequest));
    }

    try {
      setIsProcessing(true);
      setError(null);

      const newSuggestions = await deepseekManager.generateSuggestions(text);
      
      if (newSuggestions.length > 0) {
        setSuggestions(prev => {
          // Remove duplicates and add new suggestions at the beginning
          const existingSuggestions = new Set(prev);
          const uniqueNewSuggestions = newSuggestions.filter(s => !existingSuggestions.has(s));
          return [...uniqueNewSuggestions, ...prev];
        });
        
        // Mark this text as processed
        processedTexts.current.add(text.trim());
        retryCount.current = 0; // Reset retry count on success
      }

      lastRequestTime.current = Date.now();
    } catch (error) {
      console.error('Error generating suggestions:', error);
      
      // Implement retry logic for recoverable errors
      if (retryCount.current < MAX_RETRIES) {
        retryCount.current++;
        setTimeout(() => generateSuggestions(text), THROTTLE_INTERVAL * retryCount.current);
        return;
      }

      setError(error instanceof Error ? error.message : 'Failed to generate suggestions. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  return { suggestions, error, isProcessing, generateSuggestions };
}