'use client';
import { useEffect, useState } from 'react';

function normalizeCode(v:string){ return (v||'').replace(/\D/g,'').slice(0,6); }

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

export default function ControlTable({ rows, onValidate }:{ rows:any[]; onValidate:(rows:any[])=>void }){
  const [allRows, setAllRows] = useState<any[]>([]);
  
  useEffect(()=>{ 
    const updatedRows = rows.map(r=>({...r}));
    setAllRows(updatedRows);
  },[rows]);

  const rowsARegler = allRows.filter(r => !r.codeDechet || r.codeDechet.length !== 6);
  const rowsValidees = allRows.filter(r => r.codeDechet && r.codeDechet.length === 6);

  if(!rows.length) return <div className="text-slate-500 text-sm">Rien à afficher.</div>;
  return (
    <div className="space-y-6">
      {/* Tableau 1: Lignes à traiter (ROUGE) */}
      {rowsARegler.length > 0 && (
        <div className="border-2 border-red-400 rounded-lg p-4 bg-red-50">
          <h3 className="text-lg font-semibold text-red-800 mb-3">
            🔴 Lignes sans code déchet ({rowsARegler.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Date</th><th>Ressource</th><th>Entité</th><th>Chantier</th><th>Qté</th><th>Unité</th><th>Code Déchet</th><th>Suggestion</th></tr>
              </thead>
              <tbody>
                {rowsARegler.map((r,i)=>{
                  return (
                    <tr key={r.__id ?? `red-${i}`} className="bg-red-100">
                      <td>{formatDate(r.dateExpedition ?? r.Date ?? '')}</td>
                      <td className="max-w-[380px]">{r.denominationUsuelle ?? r['Libellé Ressource'] ?? ''}</td>
                      <td>{r['producteur.raisonSociale'] ?? r['Libellé Entité'] ?? ''}</td>
                      <td>{r['producteur.adresse.libelle'] ?? r['Libellé Chantier'] ?? ''}</td>
                      <td>{r.quantite ?? r.Quantité ?? ''}</td>
                      <td>{r.codeUnite ?? r.Unité ?? ''}</td>
                      <td><input className="input w-24" placeholder="170302" value={r.codeDechet ?? ''}
                        onChange={(e)=>{
                          const idx = allRows.findIndex(row => row.__id === r.__id);
                          if(idx >= 0) {
                            const next=[...allRows]; 
                            next[idx].codeDechet=normalizeCode(e.target.value); 
                            setAllRows(next);
                          }
                        }}/></td>
                      <td><button className="btn btn-ghost" disabled={!r.suggestionCodeDechet}
                        onClick={()=>{
                          const idx = allRows.findIndex(row => row.__id === r.__id);
                          if(idx >= 0 && !allRows[idx].codeDechet) {
                            const next=[...allRows]; 
                            next[idx].codeDechet=r.suggestionCodeDechet; 
                            setAllRows(next);
                          }
                        }}>Auto</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tableau 2: Lignes validées (VERT) */}
      {rowsValidees.length > 0 && (
        <div className="border-2 border-green-400 rounded-lg p-4 bg-green-50">
          <h3 className="text-lg font-semibold text-green-800 mb-3">
            🟢 Lignes avec code déchet validé ({rowsValidees.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr><th>Date</th><th>Ressource</th><th>Entité</th><th>Chantier</th><th>Qté</th><th>Unité</th><th>Code Déchet</th><th>Action</th></tr>
              </thead>
              <tbody>
                {rowsValidees.map((r,i)=>{
                  return (
                    <tr key={r.__id ?? `green-${i}`} className="bg-green-100">
                      <td>{formatDate(r.dateExpedition ?? r.Date ?? '')}</td>
                      <td className="max-w-[380px]">{r.denominationUsuelle ?? r['Libellé Ressource'] ?? ''}</td>
                      <td>{r['producteur.raisonSociale'] ?? r['Libellé Entité'] ?? ''}</td>
                      <td>{r['producteur.adresse.libelle'] ?? r['Libellé Chantier'] ?? ''}</td>
                      <td>{r.quantite ?? r.Quantité ?? ''}</td>
                      <td>{r.codeUnite ?? r.Unité ?? ''}</td>
                      <td><input className="input w-24 bg-white" value={r.codeDechet ?? ''}
                        onChange={(e)=>{
                          const idx = allRows.findIndex(row => row.__id === r.__id);
                          if(idx >= 0) {
                            const next=[...allRows]; 
                            next[idx].codeDechet=normalizeCode(e.target.value); 
                            setAllRows(next);
                          }
                        }}/></td>
                      <td><button className="btn btn-ghost" 
                        onClick={()=>{
                          const idx = allRows.findIndex(row => row.__id === r.__id);
                          if(idx >= 0) {
                            const next=[...allRows]; 
                            next[idx].codeDechet=''; 
                            setAllRows(next);
                          }
                        }}>Retirer</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3">
        {rowsARegler.length > 0 && (
          <button className="btn btn-secondary" onClick={()=>setAllRows([...allRows])}>Marquer toutes comme validées</button>
        )}
        <button className="btn btn-primary" onClick={()=>onValidate(allRows)}>Finaliser et continuer</button>
      </div>
    </div>
  );
}
