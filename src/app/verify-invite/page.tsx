import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase/supabase-client'

export default function VerifyInvitePage() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleInvite = async () => {
      try {
        // Pega o token da URL
        const params = new URLSearchParams(window.location.search)
        const token = params.get('token')
        const type = params.get('type')

        if (!token || type !== 'invite') {
          navigate('/login')
          return
        }

        // Verifica o token
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'invite'
        })

        if (error) {
          throw error
        }

        // Se sucesso, redireciona para definir senha com o token
        navigate('/set-password', { 
          state: { token },
          replace: true 
        })

      } catch (error) {
        console.error('Erro ao verificar convite:', error)
        navigate('/login')
      }
    }

    handleInvite()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Verificando convite...</p>
      </div>
    </div>
  )
}
