import React from 'react';
import { Check } from 'lucide-react';

interface ContextSummaryProps {
  type: 'guest' | 'podcast';
  summary: string;
  onConfirm: () => void;
  isConfirmed: boolean;
}

export function ContextSummary({ type, summary, onConfirm, isConfirmed }: ContextSummaryProps) {
  const title = type === 'guest' ? 'Resumo do Convidado' : 'Resumo do Podcast';

  return (
    <div className="mt-2 p-4 bg-gray-50 rounded-lg">
      <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>
      <p className="text-sm text-gray-600 whitespace-pre-wrap mb-3">{summary}</p>
      {!isConfirmed && (
        <button
          onClick={onConfirm}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
        >
          <Check className="w-4 h-4" />
          Confirmar
        </button>
      )}
    </div>
  );
}