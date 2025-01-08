import OpenAI from 'openai';

class OpenAIManager {
  private static instance: OpenAIManager;
  private client: OpenAI | null = null;

  private constructor() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('API key da OpenAI não encontrada');
    }

    this.client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  static getInstance(): OpenAIManager {
    if (!OpenAIManager.instance) {
      OpenAIManager.instance = new OpenAIManager();
    }
    return OpenAIManager.instance;
  }

  getClient(): OpenAI {
    if (!this.client) {
      throw new Error('Cliente OpenAI não inicializado');
    }
    return this.client;
  }

  async createTranscription(formData: FormData): Promise<{ text: string }> {
    try {
      if (!this.client) {
        throw new Error('Cliente OpenAI não inicializado');
      }

      const response = await this.client.audio.transcriptions.create({
        file: formData.get('file') as File,
        model: formData.get('model') as string,
        language: formData.get('language') as string
      });

      return { text: response.text };
    } catch (error) {
      console.error('Erro ao transcrever áudio:', error);
      throw error;
    }
  }
}

export const openAIManager = OpenAIManager.getInstance();
