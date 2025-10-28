'use client';
import { useEffect, useState } from 'react';

function normalizeCode(v: string) { return (v || '').replace(/\D/g, '').slice(0, 6); }

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

export default function ControlTable({ rows, onValidate }: { rows: any[]; onValidate: (rows: any[]) => void }) {
  const [allRows, setAllRows] = useState<any[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    const updatedRows = rows.map(r => ({ ...r }));
    setAllRows(updatedRows);
  }, [rows]);

  const rowsARegler = allRows.filter(r => !r.codeDechet || r.codeDechet.length !== 6);
  const rowsValidees = allRows.filter(r => r.codeDechet && r.codeDechet.length === 6);

  function autoCompleteAll() {
    const updated = allRows.map(row => {
      if (row.suggestionCodeDechet && (!row.codeDechet || row.codeDechet.length !== 6)) {
        return { ...row, codeDechet: row.suggestionCodeDechet };
      }
      return row;
    });
    setAllRows(updated);
    alert(`${updated.filter(r => r.codeDechet && r.codeDechet.length === 6).length} lignes auto-complétées !`);
  }

  function handleModify(row: any) {
    setEditingRow(row);
  }

  function handleSaveEdit(editedRow: any) {
    const updated = allRows.map((r) => (r.__id === editedRow.__id ? editedRow : r));
    setAllRows(updated);
    setEditingRow(null);
  }

  function handleDelete(rowId: string) {
    const updated = allRows.filter((r) => r.__id !== rowId);
    setAllRows(updated);
    setConfirmDelete(null);
  }

  if (!rows.length) return <div className="text-slate-500 text-sm">Rien à afficher.</div>;

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div className="flex gap-3">
          <button
            onClick={autoCompleteAll}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition shadow-md hover:shadow-lg"
            disabled={rowsARegler.length === 0}
          >
            ✨ Auto-compléter toutes les lignes
          </button>
          <button
            onClick={() => setEditMode(!editMode)}
            className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition ${
              editMode
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {editMode ? '✏️ Mode édition: ON' : '✏️ Mode édition: OFF'}
          </button>
        </div>
        <button
          className="rounded-lg bg-red-600 px-6 py-2 text-sm font-medium text-white hover:bg-red-700 transition shadow-md hover:shadow-lg"
          onClick={() => onValidate(allRows)}
        >
          Finaliser et continuer →
        </button>
      </div>

      {/* Tableau 1: Lignes à traiter (ROUGE) */}
      {rowsARegler.length > 0 && (
        <div className="border-2 border-red-400 rounded-xl p-6 bg-red-50 animate-fade-in">
          <h3 className="text-lg font-semibold text-red-800 mb-4">
            🔴 Lignes sans code déchet ({rowsARegler.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-red-100">
                <tr className="border-b-2 border-red-300">
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left max-w-[300px]">Ressource</th>
                  <th className="px-3 py-2 text-left">Entité</th>
                  <th className="px-3 py-2 text-left">Chantier</th>
                  <th className="px-3 py-2 text-center">Qté</th>
                  <th className="px-3 py-2 text-center">Unit</th>
                  <th className="px-3 py-2 text-center">Code</th>
                  <th className="px-3 py-2 text-center">Auto</th>
                  {editMode && <th className="px-3 py-2 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-red-200">
                {rowsARegler.map((r, i) => (
                  <tr key={r.__id ?? `red-${i}`} className="bg-white hover:bg-red-50 transition">
                    <td className="px-3 py-2">{formatDate(r.dateExpedition ?? r.Date ?? '')}</td>
                    <td className="px-3 py-2 max-w-[300px] truncate">{r.denominationUsuelle ?? r['Libellé Ressource'] ?? ''}</td>
                    <td className="px-3 py-2 truncate max-w-[150px]">{r['producteur.raisonSociale'] ?? r['Libellé Entité'] ?? ''}</td>
                    <td className="px-3 py-2 truncate max-w-[150px]">{r['producteur.adresse.libelle'] ?? r['Libellé Chantier'] ?? ''}</td>
                    <td className="px-3 py-2 text-center">{r.quantite ?? r.Quantité ?? ''}</td>
                    <td className="px-3 py-2 text-center">{r.codeUnite ?? r.Unité ?? ''}</td>
                    <td className="px-3 py-2">
                      <input
                        className="input w-24 text-center"
                        placeholder="170302"
                        value={r.codeDechet ?? ''}
                        onChange={(e) => {
                          const idx = allRows.findIndex(row => row.__id === r.__id);
                          if (idx >= 0) {
                            const next = [...allRows];
                            next[idx].codeDechet = normalizeCode(e.target.value);
                            setAllRows(next);
                          }
                        }}
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        className="btn btn-ghost bg-blue-600 text-white hover:bg-blue-700"
                        disabled={!r.suggestionCodeDechet}
                        onClick={() => {
                          const idx = allRows.findIndex(row => row.__id === r.__id);
                          if (idx >= 0 && r.suggestionCodeDechet) {
                            const next = [...allRows];
                            next[idx].codeDechet = r.suggestionCodeDechet;
                            setAllRows(next);
                          }
                        }}
                      >
                        Auto
                      </button>
                    </td>
                    {editMode && (
                      <td className="px-3 py-2 text-center">
                        <div className="flex gap-2 justify-center">
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
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tableau 2: Lignes validées (VERT) */}
      {rowsValidees.length > 0 && (
        <div className="border-2 border-green-400 rounded-xl p-6 bg-green-50 animate-fade-in">
          <h3 className="text-lg font-semibold text-green-800 mb-4">
            🟢 Lignes avec code déchet validé ({rowsValidees.length})
          </h3>
      <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-green-100">
                <tr className="border-b-2 border-green-300">
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left max-w-[300px]">Ressource</th>
                  <th className="px-3 py-2 text-left">Entité</th>
                  <th className="px-3 py-2 text-left">Chantier</th>
                  <th className="px-3 py-2 text-center">Qté</th>
                  <th className="px-3 py-2 text-center">Unit</th>
                  <th className="px-3 py-2 text-center">Code</th>
                  <th className="px-3 py-2 text-center">Action</th>
                  {editMode && <th className="px-3 py-2 text-center">Actions</th>}
                </tr>
          </thead>
              <tbody className="divide-y divide-green-200">
                {rowsValidees.map((r, i) => (
                  <tr key={r.__id ?? `green-${i}`} className="bg-white hover:bg-green-50 transition">
                    <td className="px-3 py-2">{formatDate(r.dateExpedition ?? r.Date ?? '')}</td>
                    <td className="px-3 py-2 max-w-[300px] truncate">{r.denominationUsuelle ?? r['Libellé Ressource'] ?? ''}</td>
                    <td className="px-3 py-2 truncate max-w-[150px]">{r['producteur.raisonSociale'] ?? r['Libellé Entité'] ?? ''}</td>
                    <td className="px-3 py-2 truncate max-w-[150px]">{r['producteur.adresse.libelle'] ?? r['Libellé Chantier'] ?? ''}</td>
                    <td className="px-3 py-2 text-center">{r.quantite ?? r.Quantité ?? ''}</td>
                    <td className="px-3 py-2 text-center">{r.codeUnite ?? r.Unité ?? ''}</td>
                    <td className="px-3 py-2">
                      <input
                        className="input w-24 bg-white text-center"
                        value={r.codeDechet ?? ''}
                        onChange={(e) => {
                          const idx = allRows.findIndex(row => row.__id === r.__id);
                          if (idx >= 0) {
                            const next = [...allRows];
                            next[idx].codeDechet = normalizeCode(e.target.value);
                            setAllRows(next);
                          }
                        }}
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        className="btn btn-ghost text-red-600 hover:bg-red-50"
                        onClick={() => {
                          const idx = allRows.findIndex(row => row.__id === r.__id);
                          if (idx >= 0) {
                            const next = [...allRows];
                            next[idx].codeDechet = '';
                            setAllRows(next);
                          }
                        }}
                      >
                        Retirer
                      </button>
                    </td>
                    {editMode && (
                      <td className="px-3 py-2 text-center">
                        <div className="flex gap-2 justify-center">
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
                    )}
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
              type="text"
              value={formatDate(edited.dateExpedition ?? edited.Date ?? '')}
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
              onChange={(e) => setEdited({ ...edited, codeDechet: (e.target.value || '').replace(/\D/g, '').slice(0, 6) })}
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
