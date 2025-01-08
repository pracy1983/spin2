import { DEEPSEEK_SYSTEM_PROMPT } from './prompts';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export class DeepseekClient {
  private static instance: DeepseekClient;
  private apiKey: string;
  private baseUrl = 'https://api.deepseek.com/chat/completions';

  private constructor() {
    const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error('API key do Deepseek não encontrada');
    }
    this.apiKey = apiKey;
  }

  static getInstance(): DeepseekClient {
    if (!DeepseekClient.instance) {
      DeepseekClient.instance = new DeepseekClient();
    }
    return DeepseekClient.instance;
  }

  private async sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async makeRequest(transcript: string, retryCount = 0): Promise<string> {
    try {
      console.log('Fazendo requisição para o Deepseek...', { retryCount, transcript });
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: DEEPSEEK_SYSTEM_PROMPT
            },
            {
              role: 'user',
              content: transcript
            }
          ],
          temperature: 0.0, // Usando 0.0 para coding/math conforme recomendado
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na resposta:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          retryCount
        });

        // Se for erro de autenticação, não tenta novamente
        if (response.status === 401) {
          throw new Error('Erro de autenticação com o Deepseek. Verifique sua API key.');
        }

        // Se ainda tiver tentativas e for um erro recuperável
        if (retryCount < MAX_RETRIES && response.status >= 500) {
          console.log('Tentando novamente em', RETRY_DELAY, 'ms');
          await this.sleep(RETRY_DELAY * (retryCount + 1));
          return this.makeRequest(transcript, retryCount + 1);
        }

        throw new Error(`Falha ao gerar perguntas: ${errorText}`);
      }

      const data = await response.json();
      console.log('Resposta do Deepseek:', data);

      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content;
      }

      throw new Error('Formato de resposta inválido');
    } catch (error) {
      console.error('Erro ao fazer requisição:', error);
      
      // Se ainda tiver tentativas e não for erro de autenticação
      if (retryCount < MAX_RETRIES && !(error instanceof Error && error.message.includes('autenticação'))) {
        console.log('Tentando novamente em', RETRY_DELAY, 'ms');
        await this.sleep(RETRY_DELAY * (retryCount + 1));
        return this.makeRequest(transcript, retryCount + 1);
      }
      
      throw error;
    }
  }

  async generateQuestions(transcript: string): Promise<string> {
    try {
      return await this.makeRequest(transcript);
    } catch (error) {
      console.error('Erro ao gerar perguntas:', error);
      throw error;
    }
  }
}
