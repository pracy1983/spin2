import { createBrowserRouter, Navigate } from 'react-router-dom'

import { useAuth } from '@/hooks/useAuth'

import LoginPage from '@/app/login/page'

import AdminPage from '@/app/admin/page'

import InteressePage from '@/app/interesse/page'



// Componente para proteger rotas

function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) {

  const { isAuthenticated, isLoading, user } = useAuth()



  if (isLoading) {

    return <div>Carregando...</div>

  }



  if (!isAuthenticated) {

    return <Navigate to="/login" replace />

  }



  if (requireAdmin && user?.role !== 'admin') {

    return <Navigate to="/" replace />

  }



  return <>{children}</>

}



export const router = createBrowserRouter([

  {

    path: '/login',

    element: <LoginPage />,

  },

  {

    path: '/admin',

    element: (

      <ProtectedRoute requireAdmin>

        <AdminPage />

      </ProtectedRoute>

    ),

  },

  {

    path: '/interesse',

    element: <InteressePage />,

  },

  {

    path: '/',

    element: (

      <ProtectedRoute>

        {/* Seu componente principal aqui */}

      </ProtectedRoute>

    ),

  },

])

