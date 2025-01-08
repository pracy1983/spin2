import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

import { supabase } from '../lib/supabase/supabase-client'



interface AuthContextType {

  session: any

  user: any

  loading: boolean

  signIn: (email: string, password: string) => Promise<{ error?: any }>

  signOut: () => Promise<void>

}



const AuthContext = createContext<AuthContextType | null>(null)



export function AuthProvider({ children }: { children: ReactNode }) {

  const [session, setSession] = useState<any>(null)

  const [user, setUser] = useState<any>(null)

  const [loading, setLoading] = useState(true)

  const navigate = useNavigate()

  const location = useLocation()



  useEffect(() => {

    // Captura parâmetros da URL

    const params = new URLSearchParams(window.location.search)

    const token = params.get('token')

    const type = params.get('type')



    if (token && type === 'invite') {

      // Remove parâmetros da URL e navega para verificação

      window.history.replaceState({}, '', window.location.pathname)

      navigate('/verify-invite', { 

        state: { token },

        replace: true 

      })

      return

    }



    // Inicializa autenticação

    const initAuth = async () => {

      try {

        // Recupera sessão atual

        const { data: { session: currentSession } } = await supabase.auth.getSession()

        

        if (currentSession) {

          setSession(currentSession)

          setUser(currentSession.user)

        }

      } catch (error) {

        console.error('Erro ao inicializar auth:', error)

      } finally {

        setLoading(false)

      }

    }



    initAuth()



    // Listener para mudanças na autenticação

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {

      console.log('Auth event:', event)

      

      if (newSession) {

        setSession(newSession)

        setUser(newSession.user)

        

        // Redireciona após login bem-sucedido

        const returnTo = sessionStorage.getItem('returnTo')

        if (returnTo) {

          sessionStorage.removeItem('returnTo')

          navigate(returnTo)

        } else {

          navigate('/')

        }

      } else {

        setSession(null)

        setUser(null)

        

        // Salva rota atual para retornar após login

        if (!location.pathname.includes('/login') && 

            !location.pathname.includes('/verify-invite') && 

            !location.pathname.includes('/set-password')) {

          sessionStorage.setItem('returnTo', location.pathname)

        }

        

        navigate('/login')

      }

    })



    return () => {

      subscription.unsubscribe()

    }

  }, [navigate, location])



  const signIn = async (email: string, password: string) => {

    try {

      const { data, error } = await supabase.auth.signInWithPassword({

        email,

        password

      })



      if (error) throw error



      return {}

    } catch (error: any) {

      console.error('Erro no login:', error)

      return { error }

    }

  }



  const signOut = async () => {

    try {

      await supabase.auth.signOut()

    } catch (error) {

      console.error('Erro no logout:', error)

    }

  }



  const value = {

    session,

    user,

    loading,

    signIn,

    signOut

  }



  return (

    <AuthContext.Provider value={value}>

      {!loading && children}

    </AuthContext.Provider>

  )

}



export const useAuth = () => {

  const context = useContext(AuthContext)

  if (!context) {

    throw new Error('useAuth deve ser usado dentro de um AuthProvider')

  }

  return context

}

