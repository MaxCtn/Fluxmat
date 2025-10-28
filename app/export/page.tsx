'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Papa from 'papaparse';
import { saveAs } from '../../components/saveAsCsv';
import { useRouter } from 'next/navigation';

export default function ExportPage() {
  const router = useRouter();
  const [registre, setRegistre] = useState<any[]>([]);

  useEffect(() => {
    const saved = sessionStorage.getItem('fluxmat_data');
    if (saved) {
      const data = JSON.parse(saved);
      setRegistre(data.registre || []);
    }
  }, []);

  async function saveToDB() {
    const res = await fetch('/api/db/save-simple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: registre })
    });
    const data = await res.json();
    if (data.error) {
      alert(`Erreur: ${data.error}`);
    } else {
      alert(`Enregistré: ${data.inserted} lignes`);
    }
  }

  function exportCSV() {
    const csv = Papa.unparse(registre);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `registre_fluxmat_${Date.now()}.csv`);
  }

  return (
    <main className="min-h-dvh bg-gray-50">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Export Registre</h1>
          <p className="text-gray-600">Téléchargez votre registre au format CSV ou enregistrez-le dans Supabase.</p>
        </div>
        
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm mb-6">
          <p className="text-gray-700 text-sm mb-4">
            Champs exportés: dateExpedition, quantite, codeUnite, denominationUsuelle, codeDechet, 
            producteur.raisonSociale, producteur.adresse.libelle, destinataire.raisonSociale.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              className="rounded-lg bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-700 transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" 
              onClick={exportCSV} 
              disabled={!registre.length}
            >
              📥 Exporter CSV
            </button>
            <button 
              className="rounded-lg border-2 border-blue-300 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800 hover:bg-blue-100 transition shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed" 
              onClick={saveToDB} 
              disabled={!registre.length}
            >
              💾 Sauvegarder dans Supabase
            </button>
            <button
              className="rounded-lg border-2 border-green-300 bg-green-50 px-4 py-3 text-sm font-medium text-green-800 hover:bg-green-100 transition shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => alert('Fonctionnalité Export GDM à implémenter')}
              disabled={!registre.length}
            >
              📤 Export vers GDM
            </button>
          </div>
        </div>

        {/* Stats */}
        {registre.length > 0 && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-lg">
                {registre.length}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-900">Lignes prêtes à l'export</h3>
                <p className="text-sm text-green-700">Toutes les lignes ont un code déchet valide</p>
              </div>
            </div>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
