import React, { useState } from 'react';
import { Upload, FileText, Link as LinkIcon } from 'lucide-react';
import { uploadContext } from '../hooks/useAISuggestions';

interface ContextUploadProps {
  type: 'guest' | 'podcast';
  onUpload: () => void;
}

export function ContextUpload({ type, onUpload }: ContextUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [links, setLinks] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      await uploadContext({
        type,
        files,
        links: links.split('\n').filter(Boolean)
      });
      onUpload();
      setFiles([]);
      setLinks('');
    } catch (error) {
      console.error('Error uploading context:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block mb-2 text-sm font-medium">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Arquivos (PDF, TXT, DOC)
          </div>
        </label>
        <input
          type="file"
          accept=".pdf,.txt,.doc,.docx"
          multiple
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-indigo-50 file:text-indigo-700
            hover:file:bg-indigo-100"
        />
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
          onChange={(e) => setLinks(e.target.value)}
          className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          rows={3}
          placeholder="https://exemplo.com/artigo&#10;https://exemplo.com/biografia"
        />
      </div>

      <button
        type="submit"
        disabled={isUploading || (files.length === 0 && !links)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Upload className="w-4 h-4" />
        {isUploading ? 'Enviando...' : 'Enviar contexto'}
      </button>
    </form>
  );
}