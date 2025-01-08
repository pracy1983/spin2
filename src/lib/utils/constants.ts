export const FETCH_CONFIG = {
  TIMEOUT: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000,
  MAX_REDIRECTS: 5,
  CACHE_TTL: 3600000
};

export const BLOCKED_DOMAINS = [
  'instagram.com',
  'facebook.com',
  'twitter.com',
  'x.com',
  'linkedin.com'
];

export const ERROR_MESSAGES = {
  SOCIAL_MEDIA: 'Links de redes sociais não são suportados. Por favor, forneça links para artigos, blogs ou documentos.',
  TIMEOUT: 'O servidor demorou muito para responder. Por favor, tente outro link.',
  GENERIC: 'Não foi possível extrair o conteúdo. Por favor, tente outro link ou envie o conteúdo como arquivo.',
  EMPTY_CONTENT: 'O conteúdo extraído está vazio. Por favor, tente outro link.'
};