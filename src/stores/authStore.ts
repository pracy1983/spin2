import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, supabaseAdmin } from '../lib/supabase/supabase-client'

interface User {
  id: string
  email: string
  role: 'admin' | 'user'
}

interface AuthState {
  user: User | null
  session: any | null
  isLoading: boolean
  error: string | null
  setSession: (session: any) => void
  setUser: (user: User | null) => void
  setError: (error: string | null) => void
  signIn: (email: string, password: string) => Promise<{ error?: any }>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isLoading: true,
      error: null,

      setSession: (session) => set({ session }),
      setUser: (user) => set({ user }),
      setError: (error) => set({ error }),

      initialize: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (profile) {
              set({ user: profile, session, error: null })
            }
          }
        } catch (error: any) {
          console.error('Erro ao inicializar:', error.message)
        } finally {
          set({ isLoading: false })
        }
      },

      signIn: async (email, password) => {
        try {
          // 1. Tenta fazer login
          let authData = await supabase.auth.signInWithPassword({
            email,
            password
          })

          // 2. Se não encontrou o usuário, cria um novo
          if (authData.error?.message?.includes('Invalid login credentials')) {
            const { error: signUpError } = await supabase.auth.signUp({
              email,
              password,
              options: {
                data: { role: 'admin' }
              }
            })
            if (signUpError) throw signUpError

            // 3. Faz login novamente após criar
            authData = await supabase.auth.signInWithPassword({
              email,
              password
            })
            if (authData.error) throw authData.error
            if (!authData.data.user) throw new Error('Usuário não encontrado')
          } else if (authData.error) {
            throw authData.error
          }

          // 4. Busca ou cria o perfil
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.data.user.id)
            .single()

          if (!existingProfile) {
            const { data: newProfile, error: profileError } = await supabase
              .from('profiles')
              .insert([
                {
                  id: authData.data.user.id,
                  email: authData.data.user.email,
                  role: 'admin'
                }
              ])
              .select()
              .single()

            if (profileError) throw profileError
            set({ user: newProfile, session: authData.session, error: null })
          } else {
            set({ user: existingProfile, session: authData.session, error: null })
          }

          return { error: null }
        } catch (error: any) {
          console.error('Erro no login:', error)
          set({ error: error.message })
          return { error }
        }
      },

      signOut: async () => {
        try {
          const { error } = await supabase.auth.signOut()
          if (error) throw error
          set({ user: null, session: null, error: null })
        } catch (error: any) {
          console.error('Erro no logout:', error)
          set({ error: error.message })
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        session: state.session
      })
    }
  )
)
