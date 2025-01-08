import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://oyqaunytohhhmoghafpo.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWF1bnl0b2hoaG1vZ2hhZnBvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTc0OTA5MiwiZXhwIjoyMDUxMzI1MDkyfQ.GGu7YAtVM96A4zqTF-2ehs8g6_EoX-eVyS39XuRD0yg'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
})

async function createAdmin() {
  try {
    // Primeiro, verifica se o usuário já existe
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'paularacy@gmail.com')
      .single()

    if (existingUser) {
      console.log('Admin já existe:', existingUser.email)
      return
    }

    // Criar usuário admin
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
      email: 'paularacy@gmail.com',
      password: 'adm@123',
      email_confirm: true,
      user_metadata: { name: 'Admin User' }
    })

    if (createError) {
      console.error('Erro ao criar usuário:', createError)
      return
    }

    console.log('Usuário criado com sucesso:', user.user.email)

    // Aguarda um momento para garantir que o trigger handle_new_user seja executado
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Atualiza o perfil para admin
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', user.user.id)

    if (updateError) {
      console.error('Erro ao atualizar perfil:', updateError)
      return
    }

    console.log('Perfil admin atualizado com sucesso')
  } catch (error) {
    console.error('Erro ao criar admin:', error)
  }
}

createAdmin()
