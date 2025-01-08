import { supabaseAdmin } from '../lib/supabase/admin-client'

export const userService = {
  async inviteUser(email: string, role: 'admin' | 'user' = 'user') {
    try {
      // Verifica se o usuário já existe
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      const userExists = existingUsers?.users.some(user => user.email === email)

      if (userExists) {
        throw new Error('Este email já está cadastrado')
      }

      // Envia o convite usando inviteUserByEmail
      const { data, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { role },
        options: {
          redirectTo: window.location.origin + '/set-password'
        }
      })

      if (inviteError) throw inviteError

      return { 
        success: true, 
        message: 'Usuário convidado com sucesso! Um email será enviado com as instruções.' 
      }

    } catch (error) {
      console.error('Erro ao convidar usuário:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao convidar usuário' 
      }
    }
  },

  async deleteUser(userId: string) {
    try {
      // O trigger on delete cascade cuidará de deletar o perfil
      const { error: userError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      
      if (userError) throw userError

      return { success: true }
    } catch (error) {
      console.error('Erro ao deletar usuário:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao deletar usuário' 
      }
    }
  },

  async listUsers() {
    try {
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError

      return { success: true, data: profiles }
    } catch (error) {
      console.error('Erro ao listar usuários:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao listar usuários',
        data: [] 
      }
    }
  }
}
