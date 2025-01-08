import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oyqaunytohhhmoghafpo.supabase.co'
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWF1bnl0b2hoaG1vZ2hhZnBvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTc0OTA5MiwiZXhwIjoyMDUxMzI1MDkyfQ.GGu7YAtVM96A4zqTF-2ehs8g6_EoX-eVyS39XuRD0yg'

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL e Service Role Key são necessários')
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false
  }
})
