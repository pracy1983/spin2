export interface Speaker {
  id: number;
  name?: string;
}

export interface TranscriptionSegment {
  text: string;
  speaker: Speaker;
  startTime: number;
  endTime: number;
}

export interface WhisperResponse {
  text: string;
  segments: TranscriptionSegment[];
  speakers: Speaker[];
}

export interface AudioRecorderCallbacks {
  onDataAvailable: (blob: Blob) => void;
  onError: (error: string) => void;
}