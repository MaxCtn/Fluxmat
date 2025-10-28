'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import ControlTable from '../../components/ControlTable';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useRouter } from 'next/navigation';

export default function ControlePage() {
  const router = useRouter();
  const [controle, setControle] = useState<any[]>([]);
  const [registre, setRegistre] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string | undefined>();

  // Charger les données depuis sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem('fluxmat_data');
    if (saved) {
      const data = JSON.parse(saved);
      setControle(data.controle || []);
      setRegistre(data.registre || []);
      setFileName(data.fileName);
    }
  }, []);

  function onValidateCorrections(rows: any[]) {
    const fixed = rows.filter(r => r.codeDechet && r.codeDechet.length === 6);
    const remaining = rows.filter(r => !r.codeDechet || r.codeDechet.length !== 6);
    
    // Mettre à jour sessionStorage
    const updatedData = {
      registre: [...(registre), ...fixed],
      controle: remaining,
      fileName: fileName || ''
    };
    sessionStorage.setItem('fluxmat_data', JSON.stringify(updatedData));
    
    setControle(remaining);
    setRegistre([...registre, ...fixed]);
    
    if (remaining.length === 0) {
      alert('Toutes les lignes ont été corrigées ! Redirection vers l\'export.');
      router.push('/export');
    } else {
      alert(`${fixed.length} lignes corrigées. ${remaining.length} lignes restent à traiter.`);
    }
  }

  function handleReportLater() {
    // Marquer les lignes comme "à compléter plus tard"
    const savedData = sessionStorage.getItem('fluxmat_data');
    if (savedData) {
      const data = JSON.parse(savedData);
      data.toComplete = controle.map(row => ({
        ...row,
        toComplete: true,
        markedAt: new Date().toISOString()
      }));
      sessionStorage.setItem('fluxmat_data', JSON.stringify(data));
    }
    alert('Les lignes ont été enregistrées pour complétion ultérieure. Retour au tableau de bord.');
    router.push('/');
  }

  if (!controle.length) {
    return (
      <main className="min-h-dvh bg-gray-50">
        <Header />
        <section className="mx-auto max-w-7xl px-4 py-10">
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Toutes les lignes ont un code déchet valide</h2>
            <p className="text-gray-600 mb-6">Vous pouvez passer à l'export.</p>
            <Link 
              href="/export" 
              className="inline-block rounded-lg bg-red-600 px-6 py-3 text-sm font-medium text-white hover:bg-red-700 transition shadow-md hover:shadow-lg"
            >
              Aller à l'Export →
            </Link>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-gray-50">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Contrôle des lignes sans code déchet</h1>
          <p className="text-gray-600">Corrigez les codes déchets manquants ou utilisez les suggestions automatiques.</p>
        </div>

        {/* Stats */}
        <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6 mb-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-lg">
                {controle.length}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-900">Lignes à corriger</h3>
                <p className="text-sm text-red-700">Code déchet manquant ou invalide</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link 
                href="/import" 
                className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition"
              >
                ← Retour à l'Import
              </Link>
            </div>
          </div>
        </div>

        {/* Tableau de contrôle */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <ControlTable rows={controle} onValidate={onValidateCorrections} />
        </div>

        {/* Actions footer */}
        {controle.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => handleReportLater()}
              className="rounded-lg border-2 border-orange-300 bg-orange-50 px-6 py-3 text-sm font-medium text-orange-800 hover:bg-orange-100 transition shadow-sm hover:shadow-md"
            >
              📌 Remplir plus tard
            </button>
            <Link
              href="/"
              className="rounded-lg border-2 border-gray-300 bg-gray-50 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition shadow-sm hover:shadow-md"
            >
              🏠 Retour au tableau de bord
            </Link>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
