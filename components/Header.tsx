'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from '../contexts/ThemeContext';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Éviter l'erreur d'hydratation en n'affichant le logo conditionnel qu'après le montage
  useEffect(() => {
    setMounted(true);
  }, []);

  // Logo par défaut pour le SSR (mode clair)
  const logoSrc = mounted && theme === 'dark' ? '/images/logosombre.png' : '/images/logoclair.png';

  return (
    <header className="border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-[#1C1C1C] transition-colors">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo et navigation */}
          <div className="flex items-center gap-6">
            <Image 
              src={logoSrc} 
              alt="Eiffage" 
              width={200} 
              height={56} 
              className="h-14 w-auto transition-opacity duration-300"
              priority
            />
            <nav className="flex items-center gap-2">
              <Link href="/" className="rounded-lg px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-slate-900 transition-colors">
                Tableau de bord
              </Link>
              <Link href="/import" className="rounded-lg px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-slate-900 transition-colors">
                Import
              </Link>
              <Link href="/controle" className="rounded-lg px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-slate-900 transition-colors">
                Contrôle
              </Link>
              <Link href="/export" className="rounded-lg px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-slate-900 transition-colors">
                Export
              </Link>
            </nav>
          </div>

          {/* Photo de profil, thème et nom utilisateur */}
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleTheme}
              className="rounded-lg p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-900 transition-colors"
              aria-label="Basculer le thème"
            >
              {mounted && theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <button className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-900 transition-colors">
              <div className="h-8 w-8 rounded-full bg-red-600 dark:bg-red-700 flex items-center justify-center text-white font-semibold">
                MC
              </div>
              <span className="hidden md:block">Maxime Contino</span>
            </button>
            <button className="rounded-lg px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-900 transition-colors">
              ⚙️ Paramètres
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

