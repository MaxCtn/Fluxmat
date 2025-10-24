'use client';
import { useState } from 'react';
import TabsNav from '../components/TabsNav';
import FileDrop from '../components/FileDrop';
import ControlTable from '../components/ControlTable';
import ExutoireSummary from '../components/ExutoireSummary';
import DBActive from '../components/DBActive';
import DatabaseFilter from '../components/DatabaseFilter';
import Papa from 'papaparse';
import { saveAs } from '../components/saveAsCsv';

type TabKey = 'import' | 'controle' | 'export' | 'database';

export default function Page(){
  const [tab, setTab] = useState<TabKey>('import');
  const [fileName, setFileName] = useState<string|undefined>();
  const [registre, setRegistre] = useState<any[]>([]);
  const [controle, setControle] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function onUpload(file: File){
    setLoading(true); setFileName(file.name);
    const form=new FormData(); form.append('file', file);
    const res=await fetch('/api/transform', { method:'POST', body:form });
    const data=await res.json();
    setRegistre(data.registre ?? []);
    setControle(data.controle ?? []);
    setLoading(false);
  }

  function onValidateCorrections(rows:any[]){
    const fixed = rows.filter(r => r.codeDechet && r.codeDechet.length===6);
    const remaining = controle.filter(r => !fixed.find(f=>f.__id===r.__id));
    setControle(remaining);
    setRegistre(prev => [...prev, ...fixed]);
    setTab('export'); // tu pourras passer sur Contrôle ou rester ici selon préférence
  }

  async function saveToDB(){
    const res = await fetch('/api/db/save-simple', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ rows: registre }) });
    const data = await res.json();
    if (data.error) {
      alert(`Erreur: ${data.error}`);
    } else {
      const message = data.duplicates > 0 
        ? `Enregistré: ${data.inserted} lignes (${data.duplicates} doublons ignorés)`
        : `Enregistré: ${data.inserted} lignes`;
      alert(message);
    }
  }

  function exportCSV(){
    const csv = Papa.unparse(registre);
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8' });
    saveAs(blob, `registre_fluxmat_${Date.now()}.csv`);
  }

  return (
    <main className="max-w-7xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">FluxMat — Portail matériaux</h1>
        <div className="text-sm text-slate-500">Import → Contrôle → Export → Base de Données</div>
      </header>

      <TabsNav active={tab} onChange={setTab} />

      {tab==='import' && (
        <section className="space-y-6">
          <div className="card p-6 space-y-3">
            <h2 className="text-xl font-semibold">Import Dépenses</h2>
            <p className="text-slate-600 text-sm">Dépose un fichier XLSX exporté depuis PRC/PIDOT.</p>
            <FileDrop onFile={onUpload} />
            {fileName && <div className="text-slate-500 text-sm">Fichier: <span className="font-medium">{fileName}</span></div>}
            {loading && <div className="text-slate-500">Traitement…</div>}
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold">Synthèse par exutoire (depuis le fichier courant)</h2>
              <span className="badge">vue fichier</span>
            </div>
            <ExutoireSummary sourceRows={registre.length ? registre : controle} />
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold">Base de données active</h2>
              <span className="badge">Supabase</span>
            </div>
            <DBActive />
          </div>
        </section>
      )}

      {tab==='controle' && (
        <section className="card p-6">
          <h2 className="text-xl font-semibold mb-2">Contrôle des lignes sans code déchet</h2>
          <ControlTable rows={controle} onValidate={onValidateCorrections} />
        </section>
      )}

      {tab==='export' && (
        <section className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Export Registre v1</h2>
              <p className="text-slate-600 text-sm">Champs: dateExpedition, quantite, codeUnite, denominationUsuelle, codeDechet, producteur.raisonSociale, producteur.adresse.libelle, destinataire.raisonSociale.</p>
            </div>
            <button className="btn btn-primary" onClick={exportCSV} disabled={!registre.length}>Exporter CSV</button>
          </div>
          <div>
            <button className="btn btn-ghost" onClick={saveToDB} disabled={!registre.length}>Enregistrer dans la base (Supabase)</button>
          </div>
        </section>
      )}

      {tab==='database' && (
        <section>
          <DatabaseFilter />
        </section>
      )}
    </main>
  );
}
