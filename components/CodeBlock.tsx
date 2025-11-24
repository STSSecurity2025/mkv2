import React, { useState } from 'react';
import { Copy, Check, Download } from 'lucide-react';

interface CodeBlockProps {
  title: string;
  code: string;
  filename?: string;
  number?: number;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ title, code, filename, number }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!filename) return;
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="mb-8 border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold text-slate-700 flex items-center gap-2">
          {number && (
            <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
              {number}
            </span>
          )}
          {title}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              copied
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
          
          {filename && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Guardar
            </button>
          )}
        </div>
      </div>
      <div className="relative group">
        <pre className="p-4 bg-slate-900 text-slate-50 text-xs font-mono overflow-x-auto max-h-[400px] scrollbar-thin whitespace-pre-wrap leading-relaxed">
          {code}
        </pre>
      </div>
    </div>
  );
};