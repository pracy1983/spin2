import { deepseekManager } from '../deepseek';
import { processLinks } from './link-processor';

export interface ContextData {
  files: File[];
  links: string[];
}

interface Contexts {
  guest: string | null;
  podcast: string | null;
}

interface ConfirmedStatus {
  guest: boolean;
  podcast: boolean;
}

export class ContextManager {
  private static instance: ContextManager;
  private contexts: Contexts = { guest: null, podcast: null };
  private confirmed: ConfirmedStatus = { guest: false, podcast: false };

  private constructor() {}

  static getInstance(): ContextManager {
    if (!ContextManager.instance) {
      ContextManager.instance = new ContextManager();
    }
    return ContextManager.instance;
  }

  private async processFiles(files: File[]): Promise<string> {
    const contents = await Promise.all(
      files.map(async (file) => {
        const text = await file.text();
        return `[${file.name}]\n${text}`;
      })
    );
    return contents.join('\n\n');
  }

  async setGuestContext(data: ContextData) {
    try {
      const [fileContents, linkContents] = await Promise.all([
        this.processFiles(data.files),
        processLinks(data.links)
      ]);

      const context = [
        fileContents,
        linkContents
      ].filter(Boolean).join('\n\n');

      const summary = await deepseekManager.generateSummary(context);
      this.contexts.guest = summary;
      this.confirmed.guest = false;
      return summary;
    } catch (error) {
      console.error('Error setting guest context:', error);
      throw error;
    }
  }

  async setPodcastContext(data: ContextData) {
    try {
      const [fileContents, linkContents] = await Promise.all([
        this.processFiles(data.files),
        processLinks(data.links)
      ]);

      const context = [
        fileContents,
        linkContents
      ].filter(Boolean).join('\n\n');

      const summary = await deepseekManager.generateSummary(context);
      this.contexts.podcast = summary;
      this.confirmed.podcast = false;
      return summary;
    } catch (error) {
      console.error('Error setting podcast context:', error);
      throw error;
    }
  }

  confirmContext(type: 'guest' | 'podcast') {
    this.confirmed[type] = true;
  }

  getConfirmedContexts(): string[] {
    const contexts: string[] = [];
    if (this.confirmed.guest && this.contexts.guest) {
      contexts.push(`Contexto do entrevistado:\n${this.contexts.guest}`);
    }
    if (this.confirmed.podcast && this.contexts.podcast) {
      contexts.push(`Contexto do entrevistador/podcast:\n${this.contexts.podcast}`);
    }
    return contexts;
  }

  clearContext() {
    this.contexts = { guest: null, podcast: null };
    this.confirmed = { guest: false, podcast: false };
  }
}

export const contextManager = ContextManager.getInstance();