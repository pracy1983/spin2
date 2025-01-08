import { Mic, LogOut } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase/supabase-client'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { signOut } = useAuthStore()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    try {
      // Primeiro, limpa a sessão do Supabase
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      // Limpa o localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.startsWith('auth-')) {
          localStorage.removeItem(key)
        }
      })

      // Limpa o estado do Zustand
      await signOut()

      // Força um reload completo da aplicação com URL absoluta
      const baseUrl = window.location.origin
      window.location.href = `${baseUrl}/login`
      setTimeout(() => window.location.reload(), 100)
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo e título */}
          <div className="flex items-center gap-2">
            <Mic className="w-8 h-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">SpinSeller Helper</h1>
          </div>
          
          {/* Botão de logout */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-indigo-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair</span>
          </button>
        </div>
      </header>

      {children}
    </div>
  )
}
