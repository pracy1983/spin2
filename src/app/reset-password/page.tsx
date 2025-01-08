import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase/supabase-client'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleVerifyToken = async () => {
      try {
        // Pegar o token da URL
        const params = new URLSearchParams(window.location.search)
        const token = params.get('token')
        const type = params.get('type')

        if (!token || type !== 'invite') {
          console.error('Token não encontrado ou tipo inválido')
          navigate('/login')
          return
        }

        // Tentar verificar o token
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'invite',
        })

        if (verifyError) {
          console.error('Erro ao verificar token:', verifyError)
          throw verifyError
        }

        console.log('Token verificado com sucesso:', data)
      } catch (err: any) {
        console.error('Erro ao processar token:', err)
        setError('Link inválido ou expirado')
        // Não redirecionar automaticamente para permitir ver o erro
      }
    }

    handleVerifyToken()
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      // Pegar o token da URL
      const params = new URLSearchParams(window.location.search)
      const token = params.get('token')

      if (!token) {
        throw new Error('Token não encontrado')
      }

      // Atualizar a senha usando o token
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) throw updateError

      // Redirecionar para login com mensagem de sucesso
      navigate('/login', { state: { message: 'Senha definida com sucesso! Faça login para continuar.' } })
    } catch (err: any) {
      console.error('Erro ao atualizar senha:', err)
      setError(err.message || 'Erro ao atualizar senha')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Defina sua senha
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Digite uma nova senha para sua conta
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="password" className="sr-only">
                Nova Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Nova senha"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="sr-only">
                Confirme a Senha
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Confirme a senha"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? 'Salvando...' : 'Salvar Nova Senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
