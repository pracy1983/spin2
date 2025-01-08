import { useState } from 'react'
import { supabase } from '../lib/supabase/supabase-client'

interface SetPasswordModalProps {
  onPasswordSet?: () => void
}

export default function SetPasswordModal({ onPasswordSet }: SetPasswordModalProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
      const { error } = await supabase.auth.updateUser({
        password: password,
        data: { has_password: true }
      })

      if (error) throw error

      if (onPasswordSet) {
        onPasswordSet()
      }
      
      // Recarrega a página após definir a senha
      window.location.reload()
    } catch (err) {
      console.error('Erro ao definir senha:', err)
      setError(err instanceof Error ? err.message : 'Erro ao definir senha')
    } finally {
      setLoading(false)
    }
  }

  // Modal bloqueante que cobre toda a tela
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" />
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl w-full max-w-md">
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Defina sua senha para continuar
              </h3>
              
              {error && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Nova senha
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      placeholder="Digite sua senha"
                    />
                  </div>
                  <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                      Confirme a senha
                    </label>
                    <input
                      id="confirm-password"
                      name="confirm-password"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                      placeholder="Digite a senha novamente"
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {loading ? 'Definindo senha...' : 'Definir senha'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
