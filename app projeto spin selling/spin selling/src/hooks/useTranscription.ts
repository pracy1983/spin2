import { useState, useCallback, useRef } from 'react';
import type { Language } from '../components/LanguageSelector';
import { SpeechRecognitionManager } from '../lib/speech-recognition/recognition-manager';
import type { TranscriptionSegment } from '../lib/speech-recognition/types';
import { DeepseekClient } from '../lib/deepseek/deepseek-client';

export function useTranscription() {
  const [isRecording, setIsRecording] = useState(false);
  const [segments, setSegments] = useState<TranscriptionSegment[]>([]);
  const [language, setLanguage] = useState<Language>('pt-BR');
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionManager = useRef<SpeechRecognitionManager | null>(null);

  const handleInterimTranscript = useCallback((segment: TranscriptionSegment) => {
    setInterimTranscript(segment.text);
  }, []);

  const handleFinalTranscript = useCallback(async (segment: TranscriptionSegment) => {
    if (!segment.text.trim()) return;
    
    try {
      // 1. Salva a transcrição do WebSpeech
      setSegments(prev => [...prev, segment]);
      setInterimTranscript('');

      // 2. Envia para o Deepseek gerar perguntas
      const deepseek = DeepseekClient.getInstance();
      await deepseek.generateQuestions(segment.text);
    } catch (error) {
      console.error('Erro ao processar transcrição:', error);
    }
  }, []);

  const handleError = useCallback((error: string) => {
    console.error(error);
    setIsRecording(false);
  }, []);

  const initializeRecognition = useCallback(() => {
    if (!recognitionManager.current) {
      recognitionManager.current = new SpeechRecognitionManager(
        language,
        {
          onInterimTranscript: handleInterimTranscript,
          onFinalTranscript: handleFinalTranscript,
          onError: handleError
        }
      );
    }
  }, [language, handleInterimTranscript, handleFinalTranscript, handleError]);

  const startRecording = useCallback(async () => {
    try {
      initializeRecognition();
      await recognitionManager.current?.start();
      setIsRecording(true);
      setSegments([]);
      setInterimTranscript('');
    } catch (error) {
      handleError(error instanceof Error ? error.message : 'Erro ao iniciar gravação');
    }
  }, [initializeRecognition]);

  const stopRecording = useCallback(async () => {
    try {
      await recognitionManager.current?.stop();
      setIsRecording(false);
    } catch (error) {
      handleError(error instanceof Error ? error.message : 'Erro ao parar gravação');
    }
  }, []);

  const toggleRecording = useCallback(async () => {
    try {
      if (isRecording) {
        await stopRecording();
      } else {
        await startRecording();
      }
    } catch (error) {
      if (error instanceof Error) {
        handleError(error.message);
      } else {
        handleError('Erro desconhecido ao alternar gravação');
      }
    }
  }, [isRecording, startRecording, stopRecording]);

  const changeLanguage = useCallback((newLanguage: Language) => {
    setLanguage(newLanguage);
  }, []);

  return {
    isRecording,
    segments,
    transcript: segments.map(s => s.text).join(' '),
    interimTranscript,
    language,
    toggleRecording,
    changeLanguage,
  };
}