import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase/supabase-client'

interface AuthState {
  session: any
  loading: boolean
  initialized: boolean
}

const initialState: AuthState = {
  session: null,
  loading: true,
  initialized: false
}

export function useAuth() {
  const [state, setState] = useState<AuthState>(initialState)
  const navigate = useNavigate()

  useEffect(() => {
    if (state.initialized) return

    // Inicializa apenas uma vez
    const init = async () => {
      try {
        // Verifica se há token de convite
        const params = new URLSearchParams(window.location.search)
        const token = params.get('token')
        const type = params.get('type')

        if (token && type === 'invite') {
          navigate('/verify-invite', { 
            state: { token },
            replace: true 
          })
          setState(prev => ({ ...prev, loading: false, initialized: true }))
          return
        }

        // Verifica sessão atual
        const { data: { session } } = await supabase.auth.getSession()
        setState({ session, loading: false, initialized: true })

      } catch (error) {
        console.error('Erro na inicialização:', error)
        setState({ session: null, loading: false, initialized: true })
      }
    }

    init()

    // Monitora mudanças na sessão
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(prev => ({ ...prev, session }))
    })

    return () => subscription.unsubscribe()
  }, [navigate, state.initialized])

  return state
}
