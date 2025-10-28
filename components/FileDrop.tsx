'use client';
import { useState, useRef } from 'react';

interface FileDropProps {
  onFile: (f: File) => void;
  existingFileName?: string;
}

export default function FileDrop({ onFile, existingFileName }: FileDropProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileSelected, setFileSelected] = useState(false);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    if (existingFileName && fileSelected && file.name !== existingFileName) {
      setPendingFile(file);
      setShowReplaceConfirm(true);
    } else {
      onFile(file);
      setFileSelected(true);
    }
  }

  function confirmReplace() {
    if (pendingFile) {
      onFile(pendingFile);
      setFileSelected(true);
      setPendingFile(null);
    }
    setShowReplaceConfirm(false);
  }

  function cancelReplace() {
    setPendingFile(null);
    setShowReplaceConfirm(false);
  }

  return (
    <>
      <div
        className={`
          relative flex flex-col items-center justify-center gap-4 
          border-2 border-dashed rounded-2xl p-12 cursor-pointer 
          transition-all duration-300
          ${isDragging ? 'border-red-500 bg-red-50 scale-105' : 'border-gray-300 hover:border-red-400 hover:bg-gray-50'}
          ${fileSelected ? 'border-green-500 bg-green-50' : ''}
        `}
        onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragOver={(e) => { e.preventDefault(); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files[0];
          if (file && file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            handleFile(file);
          }
        }}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const file = e.currentTarget.files?.[0];
            if (file) handleFile(file);
          }}
        />
        
        {fileSelected && !isDragging ? (
          <div className="flex items-center gap-3 text-green-600">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold">Fichier pris en compte</p>
              <p className="text-sm text-gray-600">{existingFileName}</p>
            </div>
          </div>
        ) : (
          <>
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div className="text-center">
              <p className="text-lg font-medium text-gray-700">
                {isDragging ? 'Relâchez le fichier ici' : 'Glissez-déposez un fichier .xlsx'}
              </p>
              <p className="text-sm text-gray-500 mt-1">ou cliquez pour parcourir</p>
            </div>
          </>
        )}
      </div>

      {/* Pop-up de confirmation */}
      {showReplaceConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 animate-slide-up">
            <h3 className="text-lg font-semibold mb-2 text-gray-900">Remplacer le fichier ?</h3>
            <p className="text-gray-600 mb-4">
              Voulez-vous remplacer le fichier actuel <strong>"{existingFileName}"</strong> par
              <strong> "{pendingFile?.name}"</strong> ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmReplace}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition"
              >
                Remplacer
              </button>
              <button
                onClick={cancelReplace}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
