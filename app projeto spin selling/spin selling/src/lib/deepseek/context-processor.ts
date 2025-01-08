import { deepseekManager } from '../deepseek';
import { contextManager } from '../context/context-manager';

export async function processContext(type: 'guest' | 'podcast', files: File[], links: string[]): Promise<string> {
  try {
    const context = type === 'guest' 
      ? await contextManager.setGuestContext({ files, links })
      : await contextManager.setPodcastContext({ files, links });
    
    const summary = await deepseekManager.generateSummary(context);
    return summary;
  } catch (error) {
    console.error('Error processing context:', error);
    throw new Error('Falha ao processar o contexto');
  }
}