'use client';
import { useState, useEffect } from 'react';

export default function Footer() {
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    // Vérifier la connexion à la base de données
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setDbStatus(data.connected ? 'connected' : 'disconnected');
      })
      .catch(() => setDbStatus('disconnected'));
  }, []);

  return (
    <footer className="mt-12 border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* État serveur */}
          <div>
            <h3 className="font-semibold mb-2 text-gray-900">État du serveur</h3>
            <div className="flex items-center gap-2">
              {dbStatus === 'checking' && (
                <span className="text-sm text-gray-500">Vérification...</span>
              )}
              {dbStatus === 'connected' && (
                <>
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  <span className="text-sm text-gray-700">Base de données connectée</span>
                </>
              )}
              {dbStatus === 'disconnected' && (
                <>
                  <span className="h-2 w-2 rounded-full bg-red-500"></span>
                  <span className="text-sm text-gray-700">Base de données hors ligne</span>
                </>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold mb-2 text-gray-900">Navigation</h3>
            <div className="text-sm text-gray-600">
              <div className="mb-1">Home</div>
              <div className="mb-1">Docs</div>
              <div className="mb-1">Guides</div>
              <div>Academy</div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2 text-gray-900">Support</h3>
            <div className="text-sm text-gray-600">
              <div className="mb-1">Help</div>
              <div className="mb-1">Contact</div>
              <div>Legal</div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-xs text-gray-500 border-t border-gray-200 pt-4">
          © {new Date().getFullYear()} FluxMat — Eiffage
        </div>
      </div>
    </footer>
  );
}

