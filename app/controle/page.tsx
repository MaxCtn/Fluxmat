'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import ControlTable from '../../components/ControlTable';
import { useRouter } from 'next/navigation';

export default function ControlePage() {
  const router = useRouter();
  const [controle, setControle] = useState<any[]>([]);
  const [registre, setRegistre] = useState<any[]>([]);

  // Charger les données depuis sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem('fluxmat_data');
    if (saved) {
      const data = JSON.parse(saved);
      setControle(data.controle || []);
      setRegistre(data.registre || []);
    }
  }, []);

  function onValidateCorrections(rows: any[]) {
    const fixed = rows.filter(r => r.codeDechet && r.codeDechet.length === 6);
    const remaining = rows.filter(r => !r.codeDechet || r.codeDechet.length !== 6);
    
    // Mettre à jour sessionStorage
    const updatedData = {
      registre: [...(registre), ...fixed],
      controle: remaining,
      fileName: sessionStorage.getItem('fluxmat_data') ? JSON.parse(sessionStorage.getItem('fluxmat_data')!).fileName : ''
    };
    sessionStorage.setItem('fluxmat_data', JSON.stringify(updatedData));
    
    setControle(remaining);
    setRegistre([...registre, ...fixed]);
    
    alert(`${fixed.length} lignes corrigées`);
    
    // Rediriger vers export si tout est validé
    if (remaining.length === 0) {
      router.push('/export');
    }
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
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-black">Contrôle des lignes sans code déchet</h1>
          <div className="text-sm bg-orange-100 text-orange-800 px-3 py-1 rounded">
            📊 Lignes à vérifier : <span className="font-bold">{controle.length}</span>
          </div>
        </div>
        
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <ControlTable rows={controle} onValidate={onValidateCorrections} />
        </div>
      </section>
    </main>
  );
}