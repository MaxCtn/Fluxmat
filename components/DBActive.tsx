'use client';
import { useEffect, useState } from 'react';

type Entry = { exutoire: string; quantite: number; nombreLignes: number; unite: string };

export default function DBActive(){
  const [items, setItems] = useState<Entry[]>([]);
  const [error, setError] = useState<string|undefined>();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState<string|undefined>();
  const [details, setDetails] = useState<any[]>([]);

  async function load(){
    setLoading(true); setError(undefined);
    const res = await fetch('/api/db/summary-simple');
    const data = await res.json();
    if (res.ok) setItems(data || []); else setError(data.error || 'Erreur');
    setLoading(false);
  }
  useEffect(()=>{ load(); }, []);

  async function openExutoire(name:string){
    setOpen(name); setDetails([]);
    const res = await fetch('/api/db/by-exutoire?name='+encodeURIComponent(name));
    const data = await res.json();
    if (res.ok) setDetails(data.rows || []);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">Base active (Supabase)</div>
        <button className="btn btn-ghost" onClick={load}>Rafraîchir</button>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {loading ? <div className="text-slate-500">Chargement…</div> : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr><th>Exutoire</th><th className="text-center" style={{textAlign: 'center'}}>Nb lignes</th><th className="text-center" style={{textAlign: 'center'}}>Quantité</th><th></th></tr></thead>
            <tbody>
              {items.map(it=>(
                <tr key={it.exutoire}>
                  <td>{it.exutoire}</td>
                  <td className="text-center" style={{textAlign: 'center'}}>{it.nombreLignes}</td>
                  <td className="text-center" style={{textAlign: 'center'}}>{it.quantite.toFixed(2)} {it.unite}</td>
                  <td className="text-right">
                    <button className="btn btn-ghost" onClick={()=>openExutoire(it.exutoire)}>{open===it.exutoire? "Fermer":"Voir +"}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">Détails — {open}</div>
            <button className="btn btn-ghost" onClick={()=> setOpen(undefined)}>Fermer</button>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Date</th><th>Ressource</th><th>Qté</th><th>Unité</th><th>Code Déchet</th><th>Entité</th><th>Chantier</th></tr></thead>
              <tbody>
                {details.map((r,i)=>(
                  <tr key={r.id ?? i}>
                    <td>{r.date_expedition}</td>
                    <td className="max-w-[360px]">{r.libelle_ressource}</td>
                    <td>{r.quantite}</td>
                    <td>{r.unite}</td>
                    <td>{r.code_dechet}</td>
                    <td>{r.libelle_entite}</td>
                    <td>{r.libelle_chantier}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
