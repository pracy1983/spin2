import { WhisperResponse } from './types';

export class WhisperClient {
  private static instance: WhisperClient;
  private apiKey: string;

  private constructor() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('API key da OpenAI não encontrada');
    }
    this.apiKey = apiKey;
  }

  static getInstance(): WhisperClient {
    if (!WhisperClient.instance) {
      WhisperClient.instance = new WhisperClient();
    }
    return WhisperClient.instance;
  }

  async transcribe(audioBlob: Blob): Promise<WhisperResponse> {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities', ['segment', 'word']);

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Falha ao transcrever áudio');
    }

    return response.json();
  }
}