import type { Language } from '../components/LanguageSelector';

interface TranscriptionSegment {
  text: string;
  isFinal: boolean;
  speakerId?: number;
}

export class SpeechRecognitionManager {
  private recognition: SpeechRecognition | null = null;
  private language: Language;
  private onInterimTranscript: (segment: TranscriptionSegment) => void;
  private onFinalTranscript: (segment: TranscriptionSegment) => void;
  private onError: (error: string) => void;
  private lastInterimResult: string = '';
  private currentSpeakerId: number = 0;
  private silenceTimer: number | null = null;
  private readonly SILENCE_THRESHOLD = 1000; // 1 segundo de silêncio para detectar novo falante

  constructor(
    language: Language,
    onInterimTranscript: (segment: TranscriptionSegment) => void,
    onFinalTranscript: (segment: TranscriptionSegment) => void,
    onError: (error: string) => void
  ) {
    this.language = language;
    this.onInterimTranscript = onInterimTranscript;
    this.onFinalTranscript = onFinalTranscript;
    this.onError = onError;
  }

  initialize() {
    if (!('webkitSpeechRecognition' in window)) {
      this.onError('Speech recognition is not supported in this browser');
      return;
    }

    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = this.language;

    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;

      // Reseta o timer de silêncio
      if (this.silenceTimer) {
        window.clearTimeout(this.silenceTimer);
      }

      this.silenceTimer = window.setTimeout(() => {
        this.currentSpeakerId++;
      }, this.SILENCE_THRESHOLD);

      if (result.isFinal) {
        this.onFinalTranscript({
          text: transcript,
          isFinal: true,
          speakerId: this.currentSpeakerId
        });
        this.lastInterimResult = '';
      } else if (transcript !== this.lastInterimResult) {
        this.onInterimTranscript({
          text: transcript,
          isFinal: false,
          speakerId: this.currentSpeakerId
        });
        this.lastInterimResult = transcript;
      }
    };

    recognition.onerror = (event) => {
      this.onError(`Speech recognition error: ${event.error}`);
    };

    recognition.onend = () => {
      if (this.silenceTimer) {
        window.clearTimeout(this.silenceTimer);
      }
    };

    this.recognition = recognition;
  }

  start() {
    this.lastInterimResult = '';
    this.currentSpeakerId = 0;
    if (!this.recognition) {
      this.initialize();
    }
    this.recognition?.start();
  }

  stop() {
    if (this.recognition) {
      if (this.silenceTimer) {
        window.clearTimeout(this.silenceTimer);
      }
      this.recognition.stop();
      this.recognition = null;
      this.lastInterimResult = '';
    }
  }

  setLanguage(language: Language) {
    this.language = language;
    if (this.recognition) {
      this.stop();
      this.initialize();
    }
  }
}