'use client';
import { useState } from 'react';
import Link from 'next/link';
import Papa from 'papaparse';
import { saveAs } from '../../components/saveAsCsv';

export default function ExportPage() {
  const [registre] = useState<any[]>([]);

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
        <h1 className="text-2xl font-bold mb-6 text-black">Export Registre</h1>
        
        <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
          <p className="text-gray-700 text-sm">Champs: dateExpedition, quantite, codeUnite, denominationUsuelle, codeDechet, producteur.raisonSociale, producteur.adresse.libelle, destinataire.raisonSociale.</p>
          
          <div className="flex flex-wrap gap-3 mt-4">
            <button className="rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700" onClick={exportCSV} disabled={!registre.length}>
              Exporter CSV
            </button>
            <button className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-black hover:bg-gray-50" onClick={saveToDB} disabled={!registre.length}>
              Enregistrer dans la base (Supabase)
            </button>
            <button
              className="rounded-xl bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"
              onClick={() => alert('Fonctionnalité Export GDM à implémenter')}
              disabled={!registre.length}
            >
              📤 Export vers GDM
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}