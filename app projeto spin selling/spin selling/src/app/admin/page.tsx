/*  */import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase/supabase-client'
import { supabaseAdmin } from '../../lib/supabase/admin-client'

interface User {
  id: string
  email: string
  role: string
  last_sign_in_at: string | null
  created_at: string
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [email, setEmail] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
    const interval = setInterval(fetchUsers, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchUsers = async () => {
    try {
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
      if (authError) throw authError

      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('*')
      if (profilesError) throw profilesError

      const combinedUsers = authUsers.users.map(authUser => {
        const profile = profiles?.find(p => p.id === authUser.id)
        return {
          id: authUser.id,
          email: authUser.email || '',
          role: profile?.role || 'user',
          last_sign_in_at: authUser.last_sign_in_at,
          created_at: authUser.created_at
        }
      })

      setUsers(combinedUsers)
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error)
      setError('Erro ao carregar usuários')
    }
  }

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      // 1. Verificar se o usuário já existe no auth
      const { data: { users: existingUsers } } = await supabaseAdmin.auth.admin.listUsers()
      const existingUser = existingUsers.find(user => user.email === email)

      if (existingUser) {
        throw new Error('Este email já está cadastrado')
      }

      // 2. Enviar convite com redirecionamento
      const redirectTo = window.location.origin + '/set-password'
      
      const { data, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: redirectTo,
        data: {
          role: isAdmin ? 'admin' : 'user'
        }
      })
      
      if (inviteError) throw inviteError

      // 3. Aguardar um momento para o usuário ser criado
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 4. Buscar o usuário recém criado
      const { data: { users: updatedUsers } } = await supabaseAdmin.auth.admin.listUsers()
      const newUser = updatedUsers.find(user => user.email === email)

      if (!newUser) {
        throw new Error('Erro ao criar usuário')
      }

      // 5. Criar o perfil
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert([
          {
            id: newUser.id,
            email: email,
            role: isAdmin ? 'admin' : 'user'
          }
        ], {
          onConflict: 'id'
        })

      if (profileError) throw profileError

      setSuccess('Convite enviado com sucesso!')
      setEmail('')
      setIsAdmin(false)
      fetchUsers()
    } catch (error: any) {
      console.error('Erro ao convidar usuário:', error)
      setError(error.message || 'Erro ao convidar usuário')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (userEmail === 'paularacy@gmail.com') {
      setError('Não é possível deletar o usuário owner')
      return
    }

    try {
      // Deletar perfil primeiro
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (profileError) throw profileError

      // Depois deletar o usuário
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (deleteError) throw deleteError

      setSuccess('Usuário deletado com sucesso!')
      fetchUsers()
    } catch (error: any) {
      console.error('Erro ao deletar usuário:', error)
      setError(error.message || 'Erro ao deletar usuário')
    }
  }

  const isUserOnline = (lastSignIn: string | null) => {
    if (!lastSignIn) return false
    const lastActive = new Date(lastSignIn).getTime()
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    return lastActive > fiveMinutesAgo
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Administração</h1>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Convidar Usuário</h2>
        <form onSubmit={handleInviteUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>
          
          <div className="flex items-center">
            <input
              id="isAdmin"
              type="checkbox"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="isAdmin" className="ml-2 block text-sm text-gray-900">
              Usuário é administrador
            </label>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="text-sm text-green-700">{success}</div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Convidar'}
          </button>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Usuários</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Função
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      isUserOnline(user.last_sign_in_at)
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {isUserOnline(user.last_sign_in_at) ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDeleteUser(user.id, user.email)}
                      disabled={user.email === 'paularacy@gmail.com'}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Deletar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
