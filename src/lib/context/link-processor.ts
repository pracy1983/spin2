import { fetchWithTimeout } from '../utils/fetch';
import { ERROR_MESSAGES } from '../utils/constants';
import { isSocialMediaUrl, isValidUrl } from '../utils/url-validator';
import * as cheerio from 'cheerio';
import { contentCache } from '../utils/cache';

async function extractContent(url: string): Promise<string> {
  try {
    // Check if it's a social media URL first
    if (isSocialMediaUrl(url)) {
      throw new Error(ERROR_MESSAGES.SOCIAL_MEDIA);
    }

    // Check cache
    const cached = contentCache.get(url);
    if (cached) return cached;

    const response = await fetchWithTimeout(url);
    const contentType = response.headers.get('content-type') || '';
    
    let content: string;
    if (contentType.includes('application/json')) {
      const json = await response.json();
      content = JSON.stringify(json, null, 2);
    } else {
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Remove unwanted elements
      $('script, style, nav, footer, header, aside, iframe').remove();
      
      // Try to find main content
      const mainContent = $('article, main, #content, .content').first();
      content = mainContent.length ? mainContent.text() : $('body').text();
      
      // Clean up the content
      content = content
        .replace(/\s+/g, ' ')
        .replace(/\[\d+\]/g, '')
        .trim();
    }

    if (!content || content.length < 50) {
      throw new Error(ERROR_MESSAGES.EMPTY_CONTENT);
    }

    // Cache the result
    contentCache.set(url, content);
    return content;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC;
    console.error(`Error extracting content from ${url}:`, error);
    return `⚠️ ${url}: ${errorMessage}`;
  }
}

export async function processLinks(links: string[]): Promise<string> {
  if (!links.length) return '';

  const validLinks = links.filter(isValidUrl);

  if (!validLinks.length) {
    return '⚠️ Nenhum link válido foi fornecido. Por favor, verifique os links e tente novamente.';
  }

  const results = await Promise.allSettled(
    validLinks.map(link => extractContent(link))
  );

  const processedContent = results
    .map(result => result.status === 'fulfilled' ? result.value : '')
    .filter(Boolean)
    .join('\n\n');

  if (!processedContent) {
    return '⚠️ Não foi possível extrair conteúdo de nenhum dos links fornecidos. Por favor, tente outros links ou envie o conteúdo como arquivo.';
  }

  return processedContent;
}