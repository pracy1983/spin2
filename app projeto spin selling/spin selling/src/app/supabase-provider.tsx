<<<<<<< HEAD
// Removido pois estamos usando o cliente Supabase diretamente
=======
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import SetPasswordModal from '@/components/SetPasswordModal'

const Context = createContext(undefined)

export default function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClientComponentClient())
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  useEffect(() => {
    const checkUserPassword = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && !user.user_metadata?.has_password) {
        setShowPasswordModal(true)
      }
    }

    // Verifica imediatamente e também quando o estado de autenticação mudar
    checkUserPassword()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        checkUserPassword()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const handlePasswordSet = () => {
    setShowPasswordModal(false)
  }

  return (
    <Context.Provider value={supabase}>
      {showPasswordModal && <SetPasswordModal onPasswordSet={handlePasswordSet} />}
      {children}
    </Context.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useSupabase must be used inside SupabaseProvider')
  }
  return context
}
>>>>>>> feature/user-invites-v2
