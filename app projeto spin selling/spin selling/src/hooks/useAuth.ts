import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase/supabase-client'
import { useNavigate, useLocation } from 'react-router-dom'

interface User {
  id: string
  email: string
  role: 'admin' | 'user'
}

export function useAuth() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  const handleSession = useCallback(async (session: any) => {
    try {
      if (session) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          console.error('Erro ao obter perfil:', profileError)
          return
        }

        if (profile) {
          setUser(profile)
          setIsAuthenticated(true)
          
          // Só redireciona se estiver na página de login
          if (location.pathname === '/login') {
            navigate(profile.role === 'admin' ? '/admin' : '/')
          }
        }
      } else {
        setUser(null)
        setIsAuthenticated(false)
        if (location.pathname !== '/login') {
          navigate('/login')
        }
      }
    } catch (error) {
      console.error('Erro ao processar sessão:', error)
    }
  }, [navigate, location.pathname])

  useEffect(() => {
    let mounted = true

    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (mounted) {
          await handleSession(session)
        }
      } catch (error) {
        console.error('Erro ao verificar usuário:', error)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session)
      if (mounted) {
        await handleSession(session)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [handleSession])

  const signIn = async (email: string, password: string) => {
    try {
      setError(null)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        setError(error.message)
        return { error }
      }

      return { data }
    } catch (err) {
      console.error('Erro no login:', err)
      setError('Erro ao fazer login')
      return { error: err }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  return { 
    isLoading, 
    isAuthenticated, 
    user, 
    error,
    signIn,
    signOut 
  }
}
