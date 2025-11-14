'use client';
import { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
}

export default function Modal({ isOpen, onClose, title, children, showCloseButton = true }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Focus pour l'accessibilité
      modalRef.current?.focus();
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-[#2A2A2E] rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-scale-in border border-white/10"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        {title && (
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
            <svg className="w-6 h-6 text-cyan-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
            </svg>
            <h3 className="text-lg font-semibold text-white flex-1">{title}</h3>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                aria-label="Fermer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        
        <div className="text-white">
          {children}
        </div>
      </div>
    </div>
  );
}

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  fixed?: number;
  remaining?: number;
}

export function AlertModal({ isOpen, onClose, message, fixed, remaining }: AlertModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-base leading-relaxed">{message}</p>
          </div>
        </div>
        
        {(fixed !== undefined || remaining !== undefined) && (
          <div className="mt-2 bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="space-y-2 text-sm">
              {fixed !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Lignes corrigées:</span>
                  <span className="text-cyan-400 font-semibold">{fixed}</span>
                </div>
              )}
              {remaining !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Lignes restent à traiter:</span>
                  <span className="text-orange-400 font-semibold">{remaining}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-white font-medium rounded-lg transition-colors shadow-lg hover:shadow-xl min-w-[100px]"
          >
            OK
          </button>
        </div>
      </div>
    </Modal>
  );
}

interface ConfirmExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  withCode: number;
  withoutCode: number;
  total: number;
}

export function ConfirmExportModal({ isOpen, onClose, onConfirm, withCode, withoutCode, total }: ConfirmExportModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={true}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <svg className="w-8 h-8 text-green-400 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">Prêt à exporter</h3>
            <p className="text-base text-gray-300 leading-relaxed">
              {withoutCode > 0 
                ? `Vous allez exporter ${withCode} ligne${withCode > 1 ? 's' : ''} avec code. ${withoutCode} ligne${withoutCode > 1 ? 's restent' : ' reste'} sans code.`
                : `Toutes les lignes (${withCode}) ont un code déchet valide.`
              }
            </p>
          </div>
        </div>
        
        <div className="mt-2 bg-white/5 rounded-lg p-5 border border-white/10">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                Lignes avec code :
              </span>
              <span className="text-green-400 font-bold text-lg">{withCode}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                Lignes sans code :
              </span>
              <span className="text-red-400 font-bold text-lg">{withoutCode}</span>
            </div>
            <div className="pt-3 border-t border-white/10 flex justify-between items-center">
              <span className="text-gray-200 font-medium flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                Total :
              </span>
              <span className="text-blue-400 font-bold text-lg">{total}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors border border-white/20"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors shadow-lg hover:shadow-xl"
          >
            Exporter →
          </button>
        </div>
      </div>
    </Modal>
  );
}

