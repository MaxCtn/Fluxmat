'use client';
import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo et navigation */}
          <div className="flex items-center gap-6">
            <Image 
              src="/images/eiffage-logo-1.png" 
              alt="Eiffage" 
              width={120} 
              height={32} 
              className="h-8 w-auto"
            />
            <nav className="flex items-center gap-2">
              <Link href="/import" className="rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:text-red-600 hover:bg-red-50">
                Import
              </Link>
              <Link href="/controle" className="rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:text-red-600 hover:bg-red-50">
                Contrôle
              </Link>
              <Link href="/export" className="rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:text-red-600 hover:bg-red-50">
                Export
              </Link>
            </nav>
          </div>

          {/* Photo de profil et nom utilisateur */}
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">
              <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center text-white font-semibold">
                MC
              </div>
              <span className="hidden md:block">Maxime Contino</span>
            </button>
            <button className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100">
              ⚙️ Paramètres
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

