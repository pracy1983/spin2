import { useState, useCallback, useRef } from 'react';
import { AudioRecorder } from '../lib/whisper/audio-recorder';
import { WhisperClient } from '../lib/whisper/whisper-client';
import type { TranscriptionSegment } from '../lib/whisper/types';

export function useWhisperTranscription() {
  const [isRecording, setIsRecording] = useState(false);
  const [segments, setSegments] = useState<TranscriptionSegment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const whisperClient = useRef(WhisperClient.getInstance());

  const handleAudioData = useCallback(async (blob: Blob) => {
    try {
      const response = await whisperClient.current.transcribe(blob);
      setSegments(prev => [...prev, ...response.segments]);
    } catch (error) {
      console.error('Erro na transcrição:', error);
      setError('Falha ao processar áudio');
    }
  }, []);

  const startRecording = useCallback(() => {
    setError(null);
    setSegments([]);

    recorderRef.current = new AudioRecorder({
      onDataAvailable: handleAudioData,
      onError: setError
    });

    recorderRef.current.start();
    setIsRecording(true);
  }, [handleAudioData]);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    segments,
    error,
    toggleRecording
  };
}