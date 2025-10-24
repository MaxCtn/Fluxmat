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
  const [local, setLocal] = useState<any[]>([]);
  useEffect(()=>{ setLocal(rows.map(r=>({...r}))); },[rows.length]);
  if(!rows.length) return <div className="text-slate-500 text-sm">Rien à corriger — tout a un code déchet.</div>;
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr><th>Date</th><th>Ressource</th><th>Entité</th><th>Chantier</th><th>Qté</th><th>Unité</th><th>Code Déchet</th><th>Suggestion</th></tr>
          </thead>
          <tbody>
            {local.map((r,i)=>(
              <tr key={r.__id ?? i}>
                <td>{formatDate(r.dateExpedition ?? r.Date ?? '')}</td>
                <td className="max-w-[380px]">{r.denominationUsuelle ?? r['Libellé Ressource'] ?? ''}</td>
                <td>{r['producteur.raisonSociale'] ?? r['Libellé Entité'] ?? ''}</td>
                <td>{r['producteur.adresse.libelle'] ?? r['Libellé Chantier'] ?? ''}</td>
                <td>{r.quantite ?? r.Quantité ?? ''}</td>
                <td>{r.codeUnite ?? r.Unité ?? ''}</td>
                <td><input className="input w-24" placeholder="170302" value={r.codeDechet ?? ''}
                  onChange={(e)=>{ const next=[...local]; next[i].codeDechet=normalizeCode(e.target.value); setLocal(next); }}/></td>
                <td><button className="btn btn-ghost" disabled={!r.suggestionCodeDechet}
                  onClick={()=>{ const next=[...local]; if(!next[i].codeDechet) next[i].codeDechet=r.suggestionCodeDechet; setLocal(next); }}>Auto</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end">
        <button className="btn btn-primary" onClick={()=>onValidate(local)}>Valider corrections</button>
      </div>
    </div>
  );
}
