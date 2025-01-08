import OpenAI from 'openai';

class OpenAIManager {
  private static instance: OpenAIManager;
  private client: OpenAI | null = null;
  private activeRuns: Map<string, string> = new Map(); // threadId -> runId
  private runQueue: Map<string, Promise<void>> = new Map(); // threadId -> Promise

  private constructor() {}

  static getInstance(): OpenAIManager {
    if (!OpenAIManager.instance) {
      OpenAIManager.instance = new OpenAIManager();
    }
    return OpenAIManager.instance;
  }

  initialize() {
    if (!this.client) {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OpenAI API key is missing');
      }
      this.client = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true
      });
    }
    return this.client;
  }

  getClient(): OpenAI {
    if (!this.client) {
      return this.initialize();
    }
    return this.client;
  }

  setActiveRun(threadId: string, runId: string) {
    this.activeRuns.set(threadId, runId);
  }

  clearActiveRun(threadId: string) {
    this.activeRuns.delete(threadId);
    this.runQueue.delete(threadId);
  }

  isRunActive(threadId: string) {
    return this.activeRuns.has(threadId);
  }

  async waitForRun(threadId: string): Promise<void> {
    const currentRun = this.runQueue.get(threadId);
    if (currentRun) {
      await currentRun;
    }
  }

  async queueRun(threadId: string, runFn: () => Promise<void>): Promise<void> {
    const currentRun = this.runQueue.get(threadId);
    const newRun = currentRun ? 
      currentRun.then(runFn) : 
      runFn();
    
    this.runQueue.set(threadId, newRun);
    
    try {
      await newRun;
    } finally {
      if (this.runQueue.get(threadId) === newRun) {
        this.runQueue.delete(threadId);
      }
    }
  }

  async cancelRun(threadId: string): Promise<void> {
    const runId = this.activeRuns.get(threadId);
    if (runId) {
      try {
        const client = this.getClient();
        await client.beta.threads.runs.cancel(threadId, runId);
      } catch (error) {
        console.error('Error canceling run:', error);
      } finally {
        this.clearActiveRun(threadId);
      }
    }
  }
}

export const openAIManager = OpenAIManager.getInstance();