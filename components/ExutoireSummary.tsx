'use client';
import { useState, useMemo } from 'react';
function groupBy<T,K>(items:T[], fn:(i:T)=>K) { const m = new Map<K,T[]>(); items.forEach(i=>{ const k=fn(i); if(!m.has(k)) m.set(k,[]); m.get(k)!.push(i); }); return m; }

function exutoireName(row:any): string {
  return row['libelle_fournisseur']
    || row['Libellé Fournisseur']
    || row['exutoire']
    || row['Code Fournisseur']
    || row['fournisseur']
    || '—';
}

// Convertir les dates Excel (nombre) en format lisible
function formatDate(dateValue: any): string {
  if (!dateValue) return '';
  
  // Si c'est déjà une date ISO ou texte formaté
  if (typeof dateValue === 'string') {
    // Format DD/MM/YYYY ou YYYY-MM-DD
    if (dateValue.includes('/') || dateValue.includes('-')) {
      return dateValue;
    }
  }
  
  // Si c'est un nombre (Excel date serial)
  const num = Number(dateValue);
  if (!isNaN(num) && num > 0) {
    // Excel date serial: nombre de jours depuis 1900-01-01
    const excelEpoch = new Date(1900, 0, 1);
    const date = new Date(excelEpoch.getTime() + (num - 1) * 24 * 60 * 60 * 1000);
    return date.toLocaleDateString('fr-FR');
  }
  
  return String(dateValue);
}

export default function ExutoireSummary({ sourceRows }:{ sourceRows:any[] }){
  // Debug: vérifier l'ordre des colonnes
  const [open, setOpen] = useState<string|undefined>(undefined);

  const grouped = useMemo(()=> groupBy(sourceRows, exutoireName), [sourceRows]);
  const entries = useMemo(()=>{
    return [...grouped.entries()].map(([exo, rows])=>{
      const quantite = rows.reduce((s,r)=> s + Number(r.quantite ?? r.Quantité ?? 0), 0);
      const count = rows.length;
      // Récupérer l'unité depuis la première ligne (toutes les lignes ont la même unité)
      const unite = rows[0]?.codeUnite ?? rows[0]?.Unité ?? 'T';
      return { exutoire: exo, quantite, count, unite, rows };
    }).sort((a,b)=> b.quantite - a.quantite);
  }, [grouped]);

  if (!entries.length) return <div className="text-slate-500 text-sm">Rien à afficher (pas de données importées ou pas de lignes matériaux).</div>;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Exutoire (carrière)</th>
              <th className="text-center" style={{textAlign: 'center'}}>Nb lignes</th>
              <th className="text-center" style={{textAlign: 'center'}}>Quantité</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {entries.map(e=>(
              <tr key={e.exutoire}>
                <td>{e.exutoire}</td>
                <td className="text-center" style={{textAlign: 'center'}}>{e.count}</td>
                <td className="text-center" style={{textAlign: 'center'}}>{e.quantite.toFixed(2)} {e.unite}</td>
                <td className="text-right">
                  <button className="btn btn-ghost" onClick={()=> setOpen(open===e.exutoire? undefined : e.exutoire)}>
                    {open===e.exutoire ? "Fermer" : "Voir +"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">Détails — {open}</div>
            <button className="btn btn-ghost" onClick={()=> setOpen(undefined)}>Fermer</button>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th><th>Ressource</th><th>Qté</th><th>Unité</th><th>Code Déchet</th><th>Entité</th><th>Chantier</th>
                </tr>
              </thead>
              <tbody>
                {grouped.get(open)?.map((r,i)=>(
                  <tr key={r.__id ?? i}>
                    <td>{formatDate(r.dateExpedition ?? r.Date)}</td>
                    <td className="max-w-[360px]">{r.denominationUsuelle ?? r["Libellé Ressource"] ?? ""}</td>
                    <td>{r.quantite ?? r.Quantité ?? ""}</td>
                    <td>{r.codeUnite ?? r.Unité ?? ""}</td>
                    <td>{r.codeDechet ?? ""}</td>
                    <td>{r["producteur.raisonSociale"] ?? r["Libellé Entité"] ?? ""}</td>
                    <td>{r["producteur.adresse.libelle"] ?? r["Libellé Chantier"] ?? ""}</td>
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
