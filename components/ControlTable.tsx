'use client';
import { useEffect, useState } from 'react';
import Toast from './Toast';
import { suggestCodeDechet } from '@/lib/wasteUtils';

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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const updatedRows = rows.map(r => ({ ...r }));
    setAllRows(updatedRows);
  }, [rows]);

  // Catégoriser les lignes
  const rowsValidees = allRows.filter(r => r.codeDechet && r.codeDechet.length === 6);
  const rowsAvecSuggestion = allRows.filter(r => {
    if (r.codeDechet && r.codeDechet.length === 6) return false; // Déjà validée
    const label = r.denominationUsuelle || r['Libellé Ressource'] || '';
    const match = suggestCodeDechet(label);
    return match !== null;
  });
  const rowsADefinir = allRows.filter(r => {
    if (r.codeDechet && r.codeDechet.length === 6) return false; // Déjà validée
    const label = r.denominationUsuelle || r['Libellé Ressource'] || '';
    const match = suggestCodeDechet(label);
    return match === null;
  });

  // Fonction pour suggérer le code déchet d'une ligne
  function getSuggestionForRow(row: any): string | null {
    const label = row.denominationUsuelle || row['Libellé Ressource'] || '';
    const match = suggestCodeDechet(label);
    return match ? match.codeCED : null;
  }

  function autoCompleteAll() {
    let count = 0;
    const updated = allRows.map(row => {
      // Ignorer les lignes qui ont déjà un code déchet valide
      if (row.codeDechet && row.codeDechet.length === 6) {
        return row;
      }
      
      // Calculer la suggestion avec le nouveau système
      const suggestion = getSuggestionForRow(row);
      
      if (suggestion) {
        count++;
        return { ...row, codeDechet: suggestion };
      }
      
      // Si aucune suggestion, marquer comme "à définir"
      return { ...row, __categorie: 'à définir' };
    });
    setAllRows(updated);
    setToastMessage(`${count} lignes auto-complétées avec succès !`);
  }

  function handleAutoForRow(row: any) {
    const suggestion = getSuggestionForRow(row);
    if (suggestion) {
      const updated = allRows.map(r => 
        r.__id === row.__id ? { ...r, codeDechet: suggestion } : r
      );
      setAllRows(updated);
      setToastMessage(`Code déchet ${suggestion} appliqué !`);
    } else {
      // Marquer comme "à définir"
      const updated = allRows.map(r => 
        r.__id === row.__id ? { ...r, __categorie: 'à définir' } : r
      );
      setAllRows(updated);
      setToastMessage(`Aucune suggestion trouvée - ligne marquée "à définir"`);
    }
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
    console.log('handleDelete called with rowId:', rowId);
    console.log('allRows before:', allRows.length);
    const updated = allRows.filter((r) => {
      console.log('Checking:', r.__id, 'vs', rowId);
      return r.__id !== rowId;
    });
    console.log('allRows after:', updated.length);
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
            className="rounded-lg bg-blue-100 text-blue-700 px-4 py-2 text-sm font-medium hover:bg-blue-200 transition shadow-md hover:shadow-lg disabled:opacity-50"
            disabled={rowsAvecSuggestion.length === 0 && rowsADefinir.length === 0}
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

      {/* Tableau 1: Lignes avec suggestion (ORANGE) */}
      {rowsAvecSuggestion.length > 0 && (
        <div className="border-2 border-orange-400 rounded-xl p-6 bg-orange-50 animate-fade-in">
          <h3 className="text-lg font-semibold text-orange-800 mb-4">
            🟠 Lignes avec suggestion ({rowsAvecSuggestion.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-orange-100">
                <tr className="border-b-2 border-orange-300">
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
              <tbody className="divide-y divide-orange-200">
                {rowsAvecSuggestion.map((r, i) => {
                  const suggestion = getSuggestionForRow(r);
                  return (
                    <tr key={r.__id ?? `orange-${i}`} className="bg-white hover:bg-orange-50 transition">
                      <td className="px-3 py-2">{formatDate(r.dateExpedition ?? r.Date ?? '')}</td>
                      <td className="px-3 py-2 max-w-[300px] truncate">{r.denominationUsuelle ?? r['Libellé Ressource'] ?? ''}</td>
                      <td className="px-3 py-2 truncate max-w-[150px]">{r['producteur.raisonSociale'] ?? r['Libellé Entité'] ?? ''}</td>
                      <td className="px-3 py-2 truncate max-w-[150px]">{r['producteur.adresse.libelle'] ?? r['Libellé Chantier'] ?? ''}</td>
                      <td className="px-3 py-2 text-center">{r.quantite ?? r.Quantité ?? ''}</td>
                      <td className="px-3 py-2 text-center">{r.codeUnite ?? r.Unité ?? ''}</td>
                      <td className="px-3 py-2">
                        <input
                          className="input w-24 text-center"
                          placeholder={suggestion || "170302"}
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
                          className="rounded-lg px-3 py-1 text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition border border-slate-300"
                          onClick={() => handleAutoForRow(r)}
                        >
                          Auto
                        </button>
                      </td>
                      {editMode && (
                        <td className="px-3 py-2 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleModify(r)}
                              className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100 transition border border-slate-300"
                              title="Modifier"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => setConfirmDelete(r.__id ?? i.toString())}
                              className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100 transition border border-slate-300"
                              title="Supprimer"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tableau 2: Lignes à définir (GRIS) */}
      {rowsADefinir.length > 0 && (
        <div className="border-2 border-gray-400 rounded-xl p-6 bg-gray-50 animate-fade-in">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            ⚪ Lignes à définir ({rowsADefinir.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-gray-100">
                <tr className="border-b-2 border-gray-300">
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
              <tbody className="divide-y divide-gray-200">
                {rowsADefinir.map((r, i) => (
                  <tr key={r.__id ?? `gray-${i}`} className="bg-white hover:bg-gray-50 transition">
                    <td className="px-3 py-2">{formatDate(r.dateExpedition ?? r.Date ?? '')}</td>
                    <td className="px-3 py-2 max-w-[300px] truncate">{r.denominationUsuelle ?? r['Libellé Ressource'] ?? ''}</td>
                    <td className="px-3 py-2 truncate max-w-[150px]">{r['producteur.raisonSociale'] ?? r['Libellé Entité'] ?? ''}</td>
                    <td className="px-3 py-2 truncate max-w-[150px]">{r['producteur.adresse.libelle'] ?? r['Libellé Chantier'] ?? ''}</td>
                    <td className="px-3 py-2 text-center">{r.quantite ?? r.Quantité ?? ''}</td>
                    <td className="px-3 py-2 text-center">{r.codeUnite ?? r.Unité ?? ''}</td>
                    <td className="px-3 py-2">
                      <input
                        className="input w-24 text-center"
                        placeholder="Manuel"
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
                        className="rounded-lg px-3 py-1 text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition border border-slate-300"
                        onClick={() => handleAutoForRow(r)}
                        title="Aucune suggestion disponible"
                      >
                        Auto
                      </button>
                    </td>
                    {editMode && (
                      <td className="px-3 py-2 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleModify(r)}
                            className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100 transition border border-slate-300"
                            title="Modifier"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => setConfirmDelete(r.__id ?? i.toString())}
                            className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100 transition border border-slate-300"
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

      {/* Tableau 3: Lignes validées (VERT) */}
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

      {/* Toast */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}

function EditModal({ row, onSave, onCancel }: { row: any; onSave: (row: any) => void; onCancel: () => void }) {
  const [edited, setEdited] = useState(row);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-[#2A2A2E] rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-6 animate-scale-in max-h-[90vh] overflow-y-auto border border-white/10">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
          <svg className="w-6 h-6 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.603L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
          <h3 className="text-lg font-semibold text-white">Modifier la ligne</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
            <input
              type="text"
              value={formatDate(edited.dateExpedition ?? edited.Date ?? '')}
              onChange={(e) => setEdited({ ...edited, dateExpedition: e.target.value, Date: e.target.value })}
              className="w-full rounded-lg bg-white/5 border border-white/20 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500 text-white placeholder-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Quantité</label>
            <input
              type="number"
              value={edited.quantite ?? edited.Quantité ?? ''}
              onChange={(e) => setEdited({ ...edited, quantite: e.target.value, Quantité: e.target.value })}
              className="w-full rounded-lg bg-white/5 border border-white/20 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Unité</label>
            <input
              type="text"
              value={edited.codeUnite ?? edited.Unité ?? ''}
              onChange={(e) => setEdited({ ...edited, codeUnite: e.target.value, Unité: e.target.value })}
              className="w-full rounded-lg bg-white/5 border border-white/20 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Code Déchet</label>
            <input
              type="text"
              value={edited.codeDechet ?? ''}
              onChange={(e) => setEdited({ ...edited, codeDechet: (e.target.value || '').replace(/\D/g, '').slice(0, 6) })}
              className="w-full rounded-lg bg-white/5 border border-white/20 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Ressource</label>
            <textarea
              value={edited.denominationUsuelle ?? edited['Libellé Ressource'] ?? ''}
              onChange={(e) => setEdited({ ...edited, denominationUsuelle: e.target.value, 'Libellé Ressource': e.target.value })}
              className="w-full rounded-lg bg-white/5 border border-white/20 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500 text-white resize-none"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Entité</label>
            <input
              type="text"
              value={edited['producteur.raisonSociale'] ?? edited['Libellé Entité'] ?? ''}
              onChange={(e) => setEdited({ ...edited, 'producteur.raisonSociale': e.target.value, 'Libellé Entité': e.target.value })}
              className="w-full rounded-lg bg-white/5 border border-white/20 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Chantier</label>
            <input
              type="text"
              value={edited['producteur.adresse.libelle'] ?? edited['Libellé Chantier'] ?? ''}
              onChange={(e) => setEdited({ ...edited, 'producteur.adresse.libelle': e.target.value, 'Libellé Chantier': e.target.value })}
              className="w-full rounded-lg bg-white/5 border border-white/20 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500 text-white"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-8 pt-4 border-t border-white/10">
          <button onClick={() => onSave(edited)} className="flex-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 px-4 py-3 text-sm font-medium text-white transition shadow-lg hover:shadow-xl">
            Enregistrer
          </button>
          <button onClick={onCancel} className="flex-1 rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:bg-white/10 transition">
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-[#2A2A2E] rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-scale-in border border-white/10">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
          <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <h3 className="text-lg font-semibold text-white">Confirmer la suppression</h3>
        </div>
        <p className="text-gray-300 mb-6">Êtes-vous sûr de vouloir supprimer cette ligne ?</p>
        <div className="flex gap-3">
          <button onClick={onConfirm} className="flex-1 rounded-lg bg-red-500 hover:bg-red-400 px-4 py-3 text-sm font-medium text-white transition shadow-lg hover:shadow-xl">
            Supprimer
          </button>
          <button onClick={onCancel} className="flex-1 rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:bg-white/10 transition">
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
