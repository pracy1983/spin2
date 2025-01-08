import { createClient } from '@supabase/supabase-js'

// Carrega as variáveis de ambiente
const supabaseUrl = 'https://mmdtsjxtwlphojcrakow.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tZHRzanh0d2xwaG9qY3Jha293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5NDY0ODYsImV4cCI6MjA1MTUyMjQ4Nn0.ScQ5QE7-jobQ0n9y-0v_We3KB_lotQGqnbnY6fWrHPQ'
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tZHRzanh0d2xwaG9qY3Jha293Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTk0NjQ4NiwiZXhwIjoyMDUxNTIyNDg2fQ.To4MQ-Cl4p66gh7Hi_4YisMd9S-T3qE9Aok8Kxr5sKA'

// Log detalhado para debug
console.log('Variáveis de ambiente do Supabase:', {
  url: supabaseUrl,
  anonKeyLength: supabaseAnonKey?.length,
  serviceKeyLength: supabaseServiceRoleKey?.length,
  anonKeyPreview: supabaseAnonKey?.substring(0, 10) + '...',
  serviceKeyPreview: supabaseServiceRoleKey?.substring(0, 10) + '...'
})

if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL é necessário')
}

if (!supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY é necessário')
}

// Cliente público (para usuários)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente admin (para operações privilegiadas)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)
