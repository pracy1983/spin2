import { Mic, MicOff } from 'lucide-react';
import { useState } from 'react';

interface RecordButtonProps {
  isRecording: boolean;
  onToggleRecording: () => void;
}

export function RecordButton({ isRecording, onToggleRecording }: RecordButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    try {
      setIsLoading(true);
      await onToggleRecording();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`fixed bottom-4 lg:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 lg:px-6 py-3 rounded-full text-white font-medium transition-all shadow-lg ${
        isLoading 
          ? 'bg-gray-400 cursor-wait' 
          : isRecording 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-indigo-600 hover:bg-indigo-700'
      }`}
    >
      {isLoading ? (
        <>
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span className="hidden sm:inline">Iniciando...</span>
        </>
      ) : isRecording ? (
        <>
          <MicOff className="w-5 h-5" />
          <span className="hidden sm:inline">Parar Gravação</span>
        </>
      ) : (
        <>
          <Mic className="w-5 h-5" />
          <span className="hidden sm:inline">Iniciar Gravação</span>
        </>
      )}
    </button>
  );
}