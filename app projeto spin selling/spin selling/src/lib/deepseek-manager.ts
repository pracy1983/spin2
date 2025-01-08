import { DEEPSEEK_SYSTEM_PROMPT } from './deepseek-prompt';
import { contextManager } from './context/context-manager';
import { SpinPhase } from './spin/types';

export interface SpinSuggestion {
  phase: SpinPhase;
  text: string;
}

export class DeepseekManager {
  private static instance: DeepseekManager;
  private apiKey: string;
  private baseUrl = 'https://api.deepseek.com/chat/completions';
  private activeRequests: Map<string, AbortController> = new Map();
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 2000; // 2 segundos entre requisições
  private readonly MAX_RETRIES = 3;
  private requestQueue: Promise<any> = Promise.resolve();

  private constructor() {
    const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error('API key do Deepseek não encontrada');
    }
    this.apiKey = apiKey;
  }

  static getInstance(): DeepseekManager {
    if (!DeepseekManager.instance) {
      DeepseekManager.instance = new DeepseekManager();
    }
    return DeepseekManager.instance;
  }

  private async enqueueRequest<T>(request: () => Promise<T>): Promise<T> {
    this.requestQueue = this.requestQueue
      .then(() => this.waitForThrottle())
      .then(request)
      .catch(error => {
        console.error('Request failed:', error);
        throw error;
      });
    return this.requestQueue as Promise<T>;
  }

  private async waitForThrottle() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();
  }

  private async retryRequest<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    for (let i = 0; i < this.MAX_RETRIES; i++) {
      try {
        await this.waitForThrottle();
        return await fn();
      } catch (error) {
        lastError = error as Error;
        console.error(`Tentativa ${i + 1} falhou:`, error);
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000)); // Exponential backoff
      }
    }
    throw lastError;
  }

  async generateSummary(text: string): Promise<string> {
    return this.enqueueRequest(async () => {
      const requestId = Date.now().toString();
      const controller = new AbortController();
      this.activeRequests.set(requestId, controller);

      try {
        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { 
                role: 'system', 
                content: 'You are a helpful assistant that creates concise summaries. Keep summaries under 250 words while retaining key information.' 
              },
              { role: 'user', content: `Please summarize this text:\n\n${text}` }
            ],
            temperature: 0.3,
            stream: false
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Erro na resposta:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          });
          throw new Error('Failed to generate summary');
        }

        const data = await response.json();
        console.log('Resposta do Deepseek (summary):', data);
        return data.choices[0].message.content;
      } finally {
        this.activeRequests.delete(requestId);
      }
    });
  }

  async generateSuggestions(text: string): Promise<string[]> {
    return this.enqueueRequest(async () => {
      const requestId = Date.now().toString();
      const controller = new AbortController();
      this.activeRequests.set(requestId, controller);

      try {
        return await this.retryRequest(async () => {
          const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
              model: 'deepseek-chat',
              messages: [
                { role: 'system', content: DEEPSEEK_SYSTEM_PROMPT },
                { role: 'user', content: text }
              ],
              temperature: 0.0,
              stream: false,
              stop: ["\n\n"]
            }),
            signal: controller.signal
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro na resposta:', {
              status: response.status,
              statusText: response.statusText,
              error: errorText
            });
            throw new Error('Failed to generate suggestions');
          }

          const data = await response.json();
          console.log('Resposta do Deepseek (suggestions):', data);
          const content = data.choices[0].message.content;
          
          // Filtrar apenas sugestões não vazias e bem formatadas
          return content
            .split('\n')
            .filter(line => {
              const trimmed = line.trim();
              // Verifica se tem o formato correto e conteúdo após o marcador
              if (!/^\[(SITUATION|PROBLEM|IMPLICATION|NEED_PAYOFF)\]/.test(trimmed)) {
                return false;
              }
              // Verifica se tem conteúdo após o marcador
              const questionContent = trimmed.replace(/^\[.*?\]\s*/, '').trim();
              return questionContent.length > 0;
            })
            .map(line => line.trim());
        });
      } finally {
        this.activeRequests.delete(requestId);
      }
    });
  }

  cancelActiveRequests() {
    this.activeRequests.forEach(controller => controller.abort());
    this.activeRequests.clear();
  }
}