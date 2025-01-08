import { Mic } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo e título */}
          <div className="flex items-center gap-2">
            <Mic className="w-8 h-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">SpinSeller Helper</h1>
          </div>
        </div>
      </header>

      {children}
    </div>
  )
}
