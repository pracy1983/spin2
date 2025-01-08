import React, { useState } from 'react';
import { X, Upload, FileText, Link as LinkIcon, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

interface ContextUploadModalProps {
  type: 'podcast' | 'guest';
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (files: File[], links: string[]) => void;
}

export function ContextUploadModal({ type, isOpen, onClose, onConfirm }: ContextUploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [links, setLinks] = useState<string>('');
  const [preview, setPreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files).slice(0, 2);
      setFiles(selectedFiles);
      setError(null);
      
      try {
        const previewText = await Promise.all(
          selectedFiles.map(async (file) => {
            const text = await file.text();
            return `${file.name}:\n${text.slice(0, 200)}...`;
          })
        );
        setPreview(previewText.join('\n\n'));
      } catch (error) {
        setError('Erro ao ler os arquivos. Por favor, tente novamente.');
        setFiles([]);
        setPreview('');
      }
    }
  };

  const handleConfirm = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);

    try {
      await onConfirm(files, links.split('\n').filter(link => link.trim()));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao processar o conteúdo. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFiles([]);
    setLinks('');
    setPreview('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const title = type === 'podcast' ? 'Contexto do Podcast' : 'Contexto do Convidado';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button 
            onClick={handleClose}
            disabled={isLoading}
            className="p-1 hover:bg-gray-100 rounded-full disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-2 mb-4">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <div>
            <label className="block mb-2 text-sm font-medium">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Arquivos (PDF, TXT, DOC - máx. 2)
              </div>
            </label>
            <input
              type="file"
              accept=".pdf,.txt,.doc,.docx,.md"
              multiple
              onChange={handleFileChange}
              disabled={isLoading}
              className={clsx(
                "block w-full text-sm text-gray-500",
                "file:mr-4 file:py-2 file:px-4",
                "file:rounded-full file:border-0",
                "file:text-sm file:font-semibold",
                "file:bg-indigo-50 file:text-indigo-700",
                "hover:file:bg-indigo-100",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            />
            {files.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700">Arquivos selecionados:</p>
                <ul className="mt-1 text-sm text-gray-600">
                  {files.map((file, index) => (
                    <li key={index}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Links (um por linha)
              </div>
            </label>
            <textarea
              value={links}
              onChange={(e) => {
                setLinks(e.target.value);
                setError(null);
              }}
              disabled={isLoading}
              className={clsx(
                "w-full px-3 py-2 text-sm border rounded-lg",
                "focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              rows={3}
              placeholder="https://exemplo.com/artigo&#10;https://exemplo.com/biografia"
            />
          </div>

          {(files.length > 0 || links.trim()) && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Preview do Conteúdo:</h3>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap">{preview}</pre>
              {links && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-700">Links:</p>
                  {links.split('\n').map((link, index) => (
                    link.trim() && (
                      <p key={index} className="text-xs text-gray-600">{link}</p>
                    )
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className={clsx(
              "px-4 py-2 text-sm font-medium text-gray-700",
              "hover:bg-gray-100 rounded-lg",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || (files.length === 0 && !links.trim())}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium",
              "text-white bg-indigo-600 rounded-lg",
              "hover:bg-indigo-700",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Confirmar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}