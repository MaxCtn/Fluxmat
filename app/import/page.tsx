'use client';
import { useState, useEffect } from 'react';
import FileDrop from '../../components/FileDrop';
import ExutoireSummary from '../../components/ExutoireSummary';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useRouter } from 'next/navigation';

export default function ImportPage() {
  const router = useRouter();
  const [fileName, setFileName] = useState<string | undefined>();
  const [registre, setRegistre] = useState<any[]>([]);
  const [controle, setControle] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Charger les données depuis sessionStorage au montage
  useEffect(() => {
    const saved = sessionStorage.getItem('fluxmat_data');
    if (saved) {
      const data = JSON.parse(saved);
      setRegistre(data.registre || []);
      setControle(data.controle || []);
      setFileName(data.fileName);
    }
  }, []);

  async function onUpload(file: File) {
    setLoading(true);
    setFileName(file.name);
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/transform', { method: 'POST', body: form });
    const data = await res.json();
    const newRegistre = data.registre ?? [];
    const newControle = data.controle ?? [];
    setRegistre(newRegistre);
    setControle(newControle);
    sessionStorage.setItem('fluxmat_data', JSON.stringify({
      registre: newRegistre,
      controle: newControle,
      fileName: file.name
    }));
    setLoading(false);
  }

  function navigateToControle() {
    sessionStorage.setItem('fluxmat_data', JSON.stringify({
      registre,
      controle,
      fileName
    }));
    router.push('/controle');
  }

  const totalLignes = registre.length + controle.length;
  const lignesValidees = registre.length;
  const lignesATraiter = controle.length;

  return (
    <main className="min-h-dvh bg-gray-50">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="text-3xl font-bold mb-3 text-gray-900">Import Dépenses</h1>
        <p className="text-gray-600 mb-8">Dépose un fichier XLSX exporté depuis PRC/PIDOT pour commencer.</p>
        
        {/* Zone de drop améliorée */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 mb-8 shadow-sm">
          <FileDrop onFile={onUpload} existingFileName={fileName} />
          {loading && (
            <div className="mt-4 flex items-center gap-3 text-blue-600 animate-pulse">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Traitement du fichier en cours...</span>
            </div>
          )}
        </div>

        {/* Résultats séparés */}
        {totalLignes > 0 && (
          <div className="space-y-6 mb-8">
            {/* Lignes validées (vert) */}
            {lignesValidees > 0 && (
              <div className="rounded-xl border-2 border-green-200 bg-green-50 p-6 shadow-sm animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
                      {lignesValidees}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-green-900">Lignes avec code déchet</h3>
                      <p className="text-sm text-green-700">Ces lignes sont prêtes à être exportées</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm font-semibold">
                    ✓ Validé
                  </span>
                </div>
              </div>
            )}

            {/* Lignes à traiter (rouge) */}
            {lignesATraiter > 0 && (
              <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6 shadow-sm animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold">
                      {lignesATraiter}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-red-900">Lignes sans code déchet</h3>
                      <p className="text-sm text-red-700">Ces lignes nécessitent une correction</p>
                    </div>
                  </div>
                  <button 
                    onClick={navigateToControle}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition shadow-md hover:shadow-lg"
                  >
                    Passer au contrôle →
                  </button>
                </div>
              </div>
            )}

            {/* Bilan */}
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
              <p className="text-sm text-blue-900">
                📊 <strong>Total: {totalLignes} lignes</strong> ({lignesValidees} validées, {lignesATraiter} à traiter)
              </p>
            </div>
          </div>
        )}

        {/* Synthèse par exutoire */}
        {totalLignes > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Synthèse par exutoire (carrière)</h2>
            <ExutoireSummary sourceRows={registre.length ? registre : controle} />
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
