import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense } from 'react'
import { LoginPage } from './app/login/page'
import { HomePage } from './app/page'
import { SetPasswordPage } from './app/set-password/page'
import { InteressePage } from './app/interesse/page'
import { AdminPage } from './app/admin/page'
import { Layout } from './components/Layout'
import { supabase } from './lib/supabase/supabase-client'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <Router>
      <Suspense fallback={<div>Carregando...</div>}>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/set-password" element={<SetPasswordPage />} />
          <Route path="/interesse" element={<InteressePage />} />
          
          {/* Rotas Protegidas */}
          <Route
            path="/"
            element={
              <RequireAuth>
                <Layout>
                  <HomePage />
                </Layout>
              </RequireAuth>
            }
          />
          
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <Layout>
                  <AdminPage />
                </Layout>
              </RequireAuth>
            }
          />
          
          {/* Redireciona rotas não encontradas para a home */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </Router>
  )
}
