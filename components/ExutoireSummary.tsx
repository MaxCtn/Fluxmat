'use client';
import { useState, useMemo } from 'react';

function groupBy<T, K>(items: T[], fn: (i: T) => K) {
  const m = new Map<K, T[]>();
  items.forEach((i) => {
    const k = fn(i);
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(i);
  });
  return m;
}

function exutoireName(row: any): string {
  // Essayer plusieurs sources pour le nom de l'exutoire
  return row['destinataire.raisonSociale'] 
    || row['libelle_fournisseur'] 
    || row['Libellé Fournisseur'] 
    || row['exutoire'] 
    || row['Code Fournisseur'] 
    || row['fournisseur']
    || '—';
}

function formatDate(dateValue: any): string {
  if (!dateValue) return '';
  if (typeof dateValue === 'string') {
    if (dateValue.includes('/') || dateValue.includes('-')) {
      return dateValue;
    }
  }
  const num = Number(dateValue);
  if (!isNaN(num) && num > 0) {
    const excelEpoch = new Date(1900, 0, 1);
    const date = new Date(excelEpoch.getTime() + (num - 1) * 24 * 60 * 60 * 1000);
    return date.toLocaleDateString('fr-FR');
  }
  return String(dateValue);
}

interface ExutoireSummaryProps {
  sourceRows: any[];
  onRowsChange?: (rows: any[]) => void;
}

export default function ExutoireSummary({ sourceRows, onRowsChange }: ExutoireSummaryProps) {
  const [open, setOpen] = useState<string | undefined>(undefined);
  const [filterCarriere, setFilterCarriere] = useState<string>('toutes');
  const [filterStatus, setFilterStatus] = useState<string>('toutes'); // 'toutes', 'avec_code', 'sans_code'
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [rows, setRows] = useState(sourceRows);

  const grouped = useMemo(() => {
    const groupedData = groupBy(rows, exutoireName);
    // Tri par ordre alphabétique des noms de carrières
    const sortedEntries = [...groupedData.entries()].sort(([a], [b]) => a.localeCompare(b));
    return new Map(sortedEntries);
  }, [rows]);
  
  const entries = useMemo(() => {
    let filtered = [...grouped.entries()];
    if (filterCarriere !== 'toutes') {
      filtered = filtered.filter(([exo]) => exo === filterCarriere);
    }
    
    // Filtrer par statut de code déchet
    if (filterStatus === 'avec_code') {
      filtered = filtered.map(([exo, rows]) => [
        exo,
        rows.filter(r => r.codeDechet && r.codeDechet.length === 6)
      ]);
    } else if (filterStatus === 'sans_code') {
      filtered = filtered.map(([exo, rows]) => [
        exo,
        rows.filter(r => !r.codeDechet || r.codeDechet.length !== 6)
      ]);
    }
    
    return filtered
      .map(([exo, rows]) => {
        const quantite = rows.reduce((s, r) => s + Number(r.quantite ?? r.Quantité ?? 0), 0);
        const count = rows.length;
        const unite = rows[0]?.codeUnite ?? rows[0]?.Unité ?? 'T';
        return { exutoire: exo, quantite, count, unite, rows };
      })
      .filter(({ count }) => count > 0) // Retirer les carrières vides après filtrage
      .sort((a, b) => b.quantite - a.quantite);
  }, [grouped, filterCarriere, filterStatus]);

  const carrieres = useMemo(() => [...grouped.keys()].sort(), [grouped]);

  function handleModify(row: any) {
    setEditingRow(row);
  }

  function handleSaveEdit(editedRow: any) {
    const updated = rows.map((r) => (r.__id === editedRow.__id ? editedRow : r));
    setRows(updated);
    if (onRowsChange) onRowsChange(updated);
    setEditingRow(null);
  }

  function handleDelete(rowId: string) {
    const updated = rows.filter((r) => r.__id !== rowId);
    setRows(updated);
    if (onRowsChange) onRowsChange(updated);
    setConfirmDelete(null);
    if (open) setOpen(undefined); // Fermer les détails si on supprime la dernière ligne d'une carrière
  }

  if (!entries.length)
    return <div className="text-slate-500 text-sm">Rien à afficher (pas de données importées ou pas de lignes matériaux).</div>;

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Filtre carrières */}
        {carrieres.length > 1 && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Carrière:</label>
            <select
              value={filterCarriere}
              onChange={(e) => setFilterCarriere(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="toutes">Toutes ({carrieres.length})</option>
              {carrieres.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}
        
        {/* Filtre statut code déchet */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Statut:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="toutes">Toutes les lignes</option>
            <option value="avec_code">Lignes avec code</option>
            <option value="sans_code">Lignes sans code</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="table w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Exutoire (carrière)</th>
              <th className="px-4 py-3 text-center">Nb lignes</th>
              <th className="px-4 py-3 text-center">Quantité</th>
              <th className="px-4 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {entries.map((e) => (
              <tr key={e.exutoire} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{e.exutoire}</td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-sm font-semibold text-blue-700">
                    {e.count}
                  </span>
                </td>
                <td className="px-4 py-3 text-center font-medium">{e.quantite.toFixed(2)} {e.unite}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    className="rounded-lg px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50 transition"
                    onClick={() => setOpen(open === e.exutoire ? undefined : e.exutoire)}
                  >
                    {open === e.exutoire ? 'Fermer' : 'Voir +'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Détails expandables */}
      {open && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Détails — {open}</h3>
            <button
              className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 transition"
              onClick={() => setOpen(undefined)}
            >
              Fermer
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="table w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2 max-w-[300px]">Ressource</th>
                  <th className="px-3 py-2">Qté</th>
                  <th className="px-3 py-2">Unité</th>
                  <th className="px-3 py-2">Code</th>
                  <th className="px-3 py-2">Entité</th>
                  <th className="px-3 py-2">Chantier</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {grouped.get(open)?.map((r, i) => (
                  <tr key={r.__id ?? i}>
                    <td className="px-3 py-2">{formatDate(r.dateExpedition ?? r.Date)}</td>
                    <td className="px-3 py-2 truncate max-w-[300px]">{r.denominationUsuelle ?? r['Libellé Ressource'] ?? ''}</td>
                    <td className="px-3 py-2">{r.quantite ?? r.Quantité ?? ''}</td>
                    <td className="px-3 py-2">{r.codeUnite ?? r.Unité ?? ''}</td>
                    <td className="px-3 py-2">{r.codeDechet ?? ''}</td>
                    <td className="px-3 py-2 truncate max-w-[200px]">{r['producteur.raisonSociale'] ?? r['Libellé Entité'] ?? ''}</td>
                    <td className="px-3 py-2 truncate max-w-[200px]">{r['producteur.adresse.libelle'] ?? r['Libellé Chantier'] ?? ''}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleModify(r)}
                          className="rounded px-2 py-1 text-blue-600 hover:bg-blue-50 transition"
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => setConfirmDelete(r.__id ?? i.toString())}
                          className="rounded px-2 py-1 text-red-600 hover:bg-red-50 transition"
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal d'édition */}
      {editingRow && (
        <EditModal row={editingRow} onSave={handleSaveEdit} onCancel={() => setEditingRow(null)} />
      )}

      {/* Confirmation suppression */}
      {confirmDelete && (
        <ConfirmDeleteModal onConfirm={() => handleDelete(confirmDelete)} onCancel={() => setConfirmDelete(null)} />
      )}
    </div>
  );
}

function EditModal({ row, onSave, onCancel }: { row: any; onSave: (row: any) => void; onCancel: () => void }) {
  const [edited, setEdited] = useState(row);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Modifier la ligne</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={edited.dateExpedition ?? edited.Date ?? ''}
              onChange={(e) => setEdited({ ...edited, dateExpedition: e.target.value, Date: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
            <input
              type="number"
              value={edited.quantite ?? edited.Quantité ?? ''}
              onChange={(e) => setEdited({ ...edited, quantite: e.target.value, Quantité: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unité</label>
            <input
              type="text"
              value={edited.codeUnite ?? edited.Unité ?? ''}
              onChange={(e) => setEdited({ ...edited, codeUnite: e.target.value, Unité: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code Déchet</label>
            <input
              type="text"
              value={edited.codeDechet ?? ''}
              onChange={(e) => setEdited({ ...edited, codeDechet: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => onSave(edited)} className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition">
            Enregistrer
          </button>
          <button onClick={onCancel} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 animate-slide-up">
        <h3 className="text-lg font-semibold mb-2 text-gray-900">Confirmer la suppression</h3>
        <p className="text-gray-600 mb-4">Êtes-vous sûr de vouloir supprimer cette ligne ?</p>
        <div className="flex gap-3">
          <button onClick={onConfirm} className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition">
            Supprimer
          </button>
          <button onClick={onCancel} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
