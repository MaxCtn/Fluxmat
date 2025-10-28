'use client';
import { useState } from 'react';
import Link from 'next/link';
import ControlTable from '../../components/ControlTable';

export default function ControlePage() {
  const [controle, setControle] = useState<any[]>([]);

  function onValidateCorrections(rows: any[]) {
    const fixed = rows.filter(r => r.codeDechet && r.codeDechet.length === 6);
    const remaining = controle.filter(r => !fixed.find(f => f.__id === r.__id));
    setControle(remaining);
    alert(`${fixed.length} lignes corrigées`);
  }

  return (
    <main className="min-h-dvh bg-white text-black">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-lg font-bold text-black">← Retour</Link>
          <nav className="flex items-center gap-2">
            <Link href="/import" className="rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:text-red-600 hover:bg-red-50">Import</Link>
            <Link href="/controle" className="rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:text-red-600 hover:bg-red-50">Contrôle</Link>
            <Link href="/export" className="rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:text-red-600 hover:bg-red-50">Export</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="text-2xl font-bold mb-6 text-black">Contrôle des lignes sans code déchet</h1>
        
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <ControlTable rows={controle} onValidate={onValidateCorrections} />
        </div>
      </section>
    </main>
  );
}