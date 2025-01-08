import { openAIManager } from '../lib/openai';

export function getOpenAIClient() {
  try {
    return openAIManager.getClient();
  } catch (error) {
    console.error('Failed to initialize OpenAI client:', error);
    return null;
  }
}