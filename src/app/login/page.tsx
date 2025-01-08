import { useState, useEffect } from 'react'

import { useLocation, useNavigate } from 'react-router-dom'

import { useAuthStore } from '../../stores/authStore'

import { supabase } from '../../lib/supabase/supabase-client'



export default function LoginPage() {

  const [email, setEmail] = useState('')

  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)

  const [error, setError] = useState<string | null>(null)

  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const location = useLocation()

  const navigate = useNavigate()

  const { signIn, user } = useAuthStore()



  useEffect(() => {

    // Verifica se há mensagem de sucesso no state

    const message = location.state?.message

    if (message) {

      setSuccessMessage(message)

    }

  }, [location])



  useEffect(() => {

    // Se já estiver logado, redireciona para home

    if (user) {

      navigate('/')

    }

  }, [user, navigate])



  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault()

    setError(null)

    setLoading(true)



    try {

      // Tenta fazer login

      const { error: signInError } = await signIn(email, password)

      

      if (signInError) {

        // Se o erro for de usuário não encontrado, tenta criar

        if (signInError.message.includes('Invalid login credentials')) {

          console.log('Usuário não encontrado, tentando criar...')

          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({

            email,

            password,

            options: {

              data: {

                role: 'admin' // Como é o primeiro usuário, será admin

              }

            }

          })



          if (signUpError) {

            throw signUpError

          }



          setSuccessMessage('Usuário criado com sucesso! Faça login novamente.')

          return

        }

        throw signInError

      }



      // Se chegou aqui, login foi bem sucedido

      // O useEffect acima vai cuidar do redirecionamento

    } catch (err: any) {

      console.error('Erro no login:', err)

      setError(err.message || 'Erro ao fazer login')

    } finally {

      setLoading(false)

    }

  }



  return (

    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">

      <div className="max-w-md w-full space-y-8">

        <div className="flex justify-center items-center mb-4">

          <img src="/sales.svg" alt="SpinSeller Logo" className="h-12 mr-2 text-white" />

          <span className="text-2xl font-bold text-white">SpinSeller Helper</span>

        </div>

        <div>

          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">

            Entre na sua conta

          </h2>

        </div>



        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>

          <div className="rounded-md shadow-sm space-y-4">

            <div>

              <label htmlFor="email" className="sr-only">

                Email

              </label>

              <input

                id="email"

                name="email"

                type="email"

                required

                value={email}

                onChange={(e) => setEmail(e.target.value)}

                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"

                placeholder="Email"

              />

            </div>



            <div>

              <label htmlFor="password" className="sr-only">

                Senha

              </label>

              <input

                id="password"

                name="password"

                type="password"

                required

                value={password}

                onChange={(e) => setPassword(e.target.value)}

                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"

                placeholder="Senha"

              />

            </div>

          </div>



          {error && (

            <div className="rounded-md bg-red-50 p-4">

              <div className="text-sm text-red-700">{error}</div>

            </div>

          )}



          {successMessage && (

            <div className="rounded-md bg-green-50 p-4">

              <div className="text-sm text-green-700">{successMessage}</div>

            </div>

          )}



          <div>

            <button

              type="submit"

              disabled={loading}

              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"

            >

              {loading ? 'Entrando...' : 'Entrar'}

            </button>

          </div>

          <div className="text-center mt-4">

            <a href="/interesse" className="text-sm text-indigo-600 hover:text-indigo-500">

              Quero ser um dos primeiros a testar

            </a>

          </div>

        </form>

      </div>

    </div>

  )

}

