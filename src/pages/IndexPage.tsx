import { useNavigate } from 'react-router-dom'

export function IndexPage() {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="flex items-center mb-8">
        <img src="/sales.svg" alt="SpinSeller Helper" className="w-12 h-12 mr-3" />
        <h1 className="text-3xl font-bold text-white">SpinSeller Helper</h1>
      </div>
      
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
          Bem-vindo ao SpinSeller Helper
        </h2>
        
        {/* Aqui virá o conteúdo principal do app */}
        <div className="space-y-4">
          <p className="text-gray-600 text-center">
            Sistema de gestão de vendas inteligente
          </p>
        </div>
      </div>
    </div>
  )
}
