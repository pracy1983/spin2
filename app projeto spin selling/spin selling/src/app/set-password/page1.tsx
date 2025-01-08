import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase/supabase-client'

export default function SetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const handlePasswordReset = async () => {
      try {
        // Pega os parâmetros da URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const error = hashParams.get('error')
        const error_code = hashParams.get('error_code')
        const error_description = hashParams.get('error_description')

        // Se houver erro
        if (error) {
          console.error('Erro:', error_code, error_description)
          
          // Trata especificamente o erro de token expirado
          if (error_code === 'otp_expired') {
            setError('O link de convite expirou. Solicite um novo convite ao administrador.')
          } else {
            setError(error_description || 'Erro ao processar o link')
          }
          
          // Aguarda 3 segundos antes de redirecionar
          setTimeout(() => navigate('/login'), 3000)
          return
        }

        // Pega o token e tipo da URL
        const access_token = hashParams.get('access_token')
        const type = hashParams.get('type')
        
        // Verifica se é um link de convite válido
        if (!access_token || type !== 'invite') {
          console.error('Token inválido ou tipo incorreto')
          setError('Link inválido ou expirado')
          setTimeout(() => navigate('/login'), 3000)
          return
        }

      } catch (error) {
        console.error('Erro ao processar token:', error)
        setError('Erro ao processar o link')
        setTimeout(() => navigate('/login'), 3000)
      }
    }

    handlePasswordReset()
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password !== confirmPassword) {
      setError('As senhas não conferem')
      setLoading(false)
      return
    }

    try {
      // Pega o token da URL novamente
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const access_token = hashParams.get('access_token')

      if (!access_token) {
        throw new Error('Token não encontrado')
      }

      // Atualiza a senha usando o token
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      // Mostra mensagem de sucesso e redireciona
      alert('Senha definida com sucesso! Você será redirecionado para o login.')
      navigate('/login')
    } catch (err) {
      console.error('Erro ao definir senha:', err)
      setError(err instanceof Error ? err.message : 'Erro ao definir senha')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Defina sua senha
          </h2>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="password" className="sr-only">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Nova senha"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">
                Confirme a senha
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Confirme a senha"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Definindo senha...' : 'Definir senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
