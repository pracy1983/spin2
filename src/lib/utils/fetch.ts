import { CORS_PROXIES, FETCH_CONFIG } from './fetch-config';

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithProxy(
  url: string,
  proxy: string,
  options: RequestInit,
  controller: AbortController
): Promise<Response> {
  const proxyUrl = `${proxy}${encodeURIComponent(url)}`;
  const response = await fetch(proxyUrl, {
    ...options,
    signal: controller.signal,
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'User-Agent': 'Mozilla/5.0 (compatible; AskPodBot/1.0)',
      ...options.headers
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response;
}

export async function fetchWithTimeout(
  resource: string,
  options: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_CONFIG.TIMEOUT);

  try {
    // Try each CORS proxy in sequence
    for (let i = 0; i < CORS_PROXIES.length; i++) {
      const proxy = CORS_PROXIES[i];
      
      try {
        const response = await fetchWithProxy(resource, proxy, options, controller);
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timed out');
        }
        
        // If this is the last proxy, throw the error
        if (i === CORS_PROXIES.length - 1) {
          throw error;
        }
        
        // Otherwise, wait before trying the next proxy
        await delay(FETCH_CONFIG.RETRY_DELAY);
        console.warn(`Failed to fetch with proxy ${proxy}, trying next proxy...`);
      }
    }

    throw new Error('All proxies failed');
  } finally {
    clearTimeout(timeoutId);
  }
}