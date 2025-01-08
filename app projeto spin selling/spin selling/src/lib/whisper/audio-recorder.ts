import { AudioRecorderCallbacks } from './types';

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private callbacks: AudioRecorderCallbacks;
  private intervalId: number | null = null;

  constructor(callbacks: AudioRecorderCallbacks) {
    this.callbacks = callbacks;
  }

  async start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.chunks = [];

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.chunks.push(e.data);
        }
      };

      this.mediaRecorder.start();

      // Envia chunks a cada 5 segundos para processamento em tempo real
      this.intervalId = window.setInterval(() => {
        if (this.mediaRecorder?.state === 'recording') {
          this.mediaRecorder.requestData();
          if (this.chunks.length > 0) {
            const blob = new Blob(this.chunks, { type: 'audio/webm' });
            this.callbacks.onDataAvailable(blob);
            this.chunks = [];
          }
        }
      }, 5000);

    } catch (error) {
      this.callbacks.onError('Falha ao iniciar gravação de áudio');
      console.error('Erro ao iniciar gravação:', error);
    }
  }

  stop() {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.stop();
      const tracks = this.mediaRecorder.stream.getTracks();
      tracks.forEach(track => track.stop());
    }

    if (this.chunks.length > 0) {
      const blob = new Blob(this.chunks, { type: 'audio/webm' });
      this.callbacks.onDataAvailable(blob);
      this.chunks = [];
    }
  }
}