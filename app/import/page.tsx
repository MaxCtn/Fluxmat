'use client';
import { useState, useEffect } from 'react';
import FileDrop from '../../components/FileDrop';
import ExutoireSummary from '../../components/ExutoireSummary';
import Link from 'next/link';
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
    // Sauvegarder dans sessionStorage
    sessionStorage.setItem('fluxmat_data', JSON.stringify({
      registre: newRegistre,
      controle: newControle,
      fileName: file.name
    }));
    setLoading(false);
  }

  function navigateToControle() {
    // S'assurer que les données sont sauvegardées
    sessionStorage.setItem('fluxmat_data', JSON.stringify({
      registre,
      controle,
      fileName
    }));
    router.push('/controle');
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
        <h1 className="text-2xl font-bold mb-6 text-black">Import Dépenses</h1>
        
        <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
          <p className="text-gray-700 text-sm">Dépose un fichier XLSX exporté depuis PRC/PIDOT.</p>
          <FileDrop onFile={onUpload} />
          {fileName && <div className="text-gray-600 text-sm">Fichier: <span className="font-medium">{fileName}</span></div>}
          {loading && <div className="text-gray-600">Traitement…</div>}

          {(registre.length > 0 || controle.length > 0) && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-black">Prévisualisation des données ({registre.length + controle.length} lignes)</h3>
                <button 
                  onClick={navigateToControle}
                  className="rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  Passer au contrôle des lignes →
                </button>
              </div>
              
              <div className="text-sm bg-red-50 border border-red-200 p-3 rounded-lg">
                📋 {registre.length} lignes prêtes à l'envoi (code déchet présent) • {controle.length} lignes à traiter (code déchet manquant)
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-semibold mb-4 text-black">Synthèse par exutoire (depuis le fichier courant)</h2>
          <ExutoireSummary sourceRows={registre.length ? registre : controle} />
        </div>
      </section>
    </main>
  );
}