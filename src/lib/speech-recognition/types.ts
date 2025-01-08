export interface TranscriptionSegment {
  text: string;
  isFinal: boolean;
  speakerId?: number;
}

export interface TranscriptionCallbacks {
  onInterimTranscript: (segment: TranscriptionSegment) => void;
  onFinalTranscript: (segment: TranscriptionSegment) => void;
  onError: (error: string) => void;
}