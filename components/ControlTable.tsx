'use client';
import { useEffect, useRef, useState } from 'react';
import Toast from './Toast';
import SortableHeader, { SortDirection } from './SortableHeader';
import { suggestCodeDechet, isDangerousCode, parseCodeDechetWithDanger, isValidCodeDechet } from '@/lib/wasteUtils';

/**
 * Icône stylo pour modifier
 */
function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

/**
 * Icône poubelle pour supprimer
 */
function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function normalizeCode(v: string) { return (v || '').replace(/\D/g, '').slice(0, 6); }

/**
 * Formate le code déchet pour l'affichage avec/sans astérisque selon l'état danger
 */
function formatCodeDechet(code: string | undefined, danger: boolean | undefined): string {
  if (!code) return '';
  const cleanCode = code.replace(/\*/g, '').replace(/[\s\-]/g, '');
  if (danger === true) {
    return cleanCode + '*';
  }
  return cleanCode;
}

/**
 * Extrait le code déchet propre (sans astérisque) et détecte le danger
 */
function parseCodeInput(value: string): { code: string; danger: boolean } {
  if (!value) return { code: '', danger: false };
  const trimmed = value.trim();
  const hasAsterisk = trimmed.endsWith('*') || trimmed.includes('*');
  const code = trimmed.replace(/\*/g, '').replace(/[\s\-]/g, '').slice(0, 6);
  return { code, danger: hasAsterisk };
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

function getRowIdentifier(row: any, fallback: string | number) {
  return String(row?.__id ?? fallback);
}

export default function ControlTable({ rows, onValidate, onRowsChange, onValidateRows }: { rows: any[]; onValidate: (rows: any[]) => void; onRowsChange?: (rows: any[]) => void; onValidateRows?: (rows: any[]) => void }) {
  const [allRows, setAllRows] = useState<any[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [sortState, setSortState] = useState<{ key: string; direction: SortDirection } | null>(null);
  const syncingFromParent = useRef(false);

  useEffect(() => {
    syncingFromParent.current = true;
    const updatedRows = rows.map(r => ({ ...r }));
    setAllRows(updatedRows);
  }, [rows]);

  // Notifier le parent quand allRows change
  useEffect(() => {
    if (syncingFromParent.current) {
      syncingFromParent.current = false;
      return;
    }
    if (onRowsChange && allRows.length > 0) {
      onRowsChange(allRows);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRows]);

  // Récupère la suggestion (code + danger) en priorité depuis `suggestionCodeDechet`
  function getSuggestionWithDanger(row: any): { code: string; danger?: boolean } | null {
    if (row.suggestionCodeDechet) {
      const parsed = parseCodeDechetWithDanger(String(row.suggestionCodeDechet));
      if (!parsed.code) return null;
      const danger = row.danger ?? parsed.danger;
      return { code: parsed.code, danger };
    }

    const label = row.denominationUsuelle || row['Libellé Ressource'] || '';
    const match = suggestCodeDechet(label);
    if (!match) return null;
    return { code: match.codeCED, danger: match.danger };
  }

  // Catégoriser les lignes
  const rowsValidees = allRows.filter(r => isValidCodeDechet(r.codeDechet));
  const rowsAvecSuggestion = allRows.filter(r => {
    if (isValidCodeDechet(r.codeDechet)) return false;
    return getSuggestionWithDanger(r) !== null;
  });
  const rowsADefinir = allRows.filter(r => {
    if (isValidCodeDechet(r.codeDechet)) return false;
    return getSuggestionWithDanger(r) === null;
  });

  // Fonction pour suggérer le code déchet d'une ligne
  function getSuggestionForRow(row: any): string | null {
    const info = getSuggestionWithDanger(row);
    return info ? info.code : null;
  }

  // Fonction pour obtenir le danger depuis la suggestion
  function getDangerForRow(row: any): boolean | undefined {
    const info = getSuggestionWithDanger(row);
    return info?.danger;
  }

  function autoCompleteAll() {
    let count = 0;
    const updated = allRows.map(row => {
      // Ignorer les lignes qui ont déjà un code déchet valide
      if (isValidCodeDechet(row.codeDechet)) {
        return row;
      }
      
      // Calculer la suggestion avec le nouveau système
      const suggestion = getSuggestionForRow(row);
      const dangerFromSuggestion = getDangerForRow(row);
      
      // Vérifier aussi si le label original contient un astérisque
      const label = row.denominationUsuelle || row['Libellé Ressource'] || '';
      const dangerFromAsterisk = isDangerousCode(label);
      
      // Priorité : astérisque dans le label > suggestion de la table
      // Si dangerFromSuggestion est true, alors finalDanger est true
      const finalDanger = dangerFromAsterisk || dangerFromSuggestion === true;
      
      if (suggestion) {
        count++;
        return { 
          ...row, 
          codeDechet: suggestion,
          danger: finalDanger // Force danger à true si finalDanger est true, sinon false
        };
      }
      
      // Si aucune suggestion, marquer comme "à définir"
      return { ...row, __categorie: 'à définir' };
    });
    setAllRows(updated);
    setToastMessage(`${count} lignes auto-complétées avec succès !`);
  }

  function handleAutoForRow(row: any) {
    const suggestion = getSuggestionForRow(row);
    const dangerFromSuggestion = getDangerForRow(row);
    if (suggestion) {
      // Vérifier si le code suggéré contient un astérisque (dans le format original de la table)
      // La suggestion retourne un code sans astérisque, donc on utilise dangerFromSuggestion
      // Mais on peut aussi vérifier dans le label original
      const label = row.denominationUsuelle || row['Libellé Ressource'] || '';
      const dangerFromAsterisk = isDangerousCode(label);
      
      // Priorité : astérisque dans le label > suggestion de la table
      // Si l'un des deux est true, alors finalDanger est true
      const finalDanger = dangerFromAsterisk || dangerFromSuggestion === true;
      
      const updated = allRows.map(r => 
        r.__id === row.__id ? { 
          ...r, 
          codeDechet: suggestion, // Code propre sans astérisque
          danger: finalDanger // Force danger à true si finalDanger est true, sinon false
        } : r
      );
      setAllRows(updated);
      const codeDisplay = formatCodeDechet(suggestion, finalDanger);
      setToastMessage(`Code déchet ${codeDisplay} appliqué !`);
    } else {
      // Marquer comme "à définir"
      const updated = allRows.map(r => 
        r.__id === row.__id ? { ...r, __categorie: 'à définir' } : r
      );
      setAllRows(updated);
      setToastMessage(`Aucune suggestion trouvée - ligne marquée "à définir"`);
    }
  }
  
  function handleValidateRow(row: any) {
    if (onValidateRows && isValidCodeDechet(row.codeDechet)) {
      onValidateRows([row]);
      setToastMessage(`Ligne validée !`);
    }
  }
  
  function handleValidateAllRows() {
    const validRows = allRows.filter(r => isValidCodeDechet(r.codeDechet));
    if (onValidateRows && validRows.length > 0) {
      onValidateRows(validRows);
      setToastMessage(`${validRows.length} lignes validées !`);
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

  // Gestion du tri
  const handleSort = (key: string) => {
    setSortState(prev => {
      if (prev?.key === key) {
        // Cycle: asc -> desc -> null -> asc
        if (prev.direction === 'asc') {
          return { key, direction: 'desc' };
        } else if (prev.direction === 'desc') {
          return null;
        }
      }
      return { key, direction: 'asc' };
    });
  };

  // Fonction de tri pour les lignes
  const sortRows = (rows: any[], sortKey: string | null, sortDirection: SortDirection): any[] => {
    if (!sortKey || !sortDirection) {
      return rows;
    }

    const sorted = [...rows].sort((a, b) => {
      let comparison = 0;

      switch (sortKey) {
        case 'date':
          const dateA = formatDate(a.dateExpedition ?? a.Date ?? '');
          const dateB = formatDate(b.dateExpedition ?? b.Date ?? '');
          comparison = dateA.localeCompare(dateB);
          break;
        case 'denomination':
          const denomA = a.denominationUsuelle ?? a['Libellé Ressource'] ?? '';
          const denomB = b.denominationUsuelle ?? b['Libellé Ressource'] ?? '';
          comparison = denomA.localeCompare(denomB);
          break;
        case 'quantite':
          const qtyA = Number(a.quantite ?? a.Quantité ?? 0);
          const qtyB = Number(b.quantite ?? b.Quantité ?? 0);
          comparison = qtyA - qtyB;
          break;
        case 'unite':
          const uniteA = a.codeUnite ?? a.Unité ?? '';
          const uniteB = b.codeUnite ?? b.Unité ?? '';
          comparison = uniteA.localeCompare(uniteB);
          break;
        case 'codeDechet':
          const codeA = a.codeDechet ?? '';
          const codeB = b.codeDechet ?? '';
          comparison = codeA.localeCompare(codeB);
          break;
        default:
          return 0;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  };

  if (!rows.length) return <div className="text-gray-500 text-sm">Rien à afficher.</div>;

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={autoCompleteAll}
          className="rounded-lg bg-blue-50 text-blue-900 px-4 py-2 text-sm font-medium hover:bg-blue-100 transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 disabled:opacity-50 border border-blue-200"
          disabled={rowsAvecSuggestion.length === 0 && rowsADefinir.length === 0}
        >
          Auto-compléter toutes les lignes
        </button>
        {allRows.some(r => isValidCodeDechet(r.codeDechet)) && (
          <button
            onClick={handleValidateAllRows}
            className="rounded-lg bg-green-600 text-white px-4 py-2 text-sm font-medium hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
          >
            Valider toutes les lignes
          </button>
        )}
        <button
          onClick={() => setEditMode(!editMode)}
          className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all duration-200 ${
            editMode
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          {editMode ? 'Mode édition: ON' : 'Mode édition: OFF'}
        </button>
      </div>

      {/* Tableau 1: Lignes avec suggestion (BLEU) */}
      {rowsAvecSuggestion.length > 0 && (
        <div className="border-2 border-blue-200 rounded-xl p-6 bg-blue-50 animate-fade-in shadow-sm">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 transition-all duration-300">
            {rowsAvecSuggestion.length} Lignes avec suggestion
          </h3>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-blue-50">
                <tr className="border-b-2 border-blue-200">
                  <SortableHeader 
                    label="Date" 
                    sortKey="date" 
                    currentSort={sortState} 
                    onSort={handleSort}
                    className="px-3 py-2"
                  />
                  <SortableHeader 
                    label="Dénomination" 
                    sortKey="denomination" 
                    currentSort={sortState} 
                    onSort={handleSort}
                    className="px-3 py-2"
                  />
                  <SortableHeader 
                    label="Quantité" 
                    sortKey="quantite" 
                    currentSort={sortState} 
                    onSort={handleSort}
                    className="px-3 py-2 text-center"
                  />
                  <SortableHeader 
                    label="Unité" 
                    sortKey="unite" 
                    currentSort={sortState} 
                    onSort={handleSort}
                    className="px-3 py-2 text-center"
                  />
                  <SortableHeader 
                    label="Code déchet" 
                    sortKey="codeDechet" 
                    currentSort={sortState} 
                    onSort={handleSort}
                    className="px-3 py-2 text-center"
                  />
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Danger</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  {editMode && <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Édition</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-200">
                {sortRows(rowsAvecSuggestion, sortState?.key || null, sortState?.direction || null).map((r, i) => {
                  const suggestion = getSuggestionForRow(r);
                  const rowIdentifier = getRowIdentifier(r, `blue-${i}`);
                  const codeInputId = `code-dechet-${rowIdentifier}`;
                  const dangerInputId = `danger-flag-${rowIdentifier}`;
                  const hasValidCode = isValidCodeDechet(r.codeDechet);
                  return (
                    <tr key={rowIdentifier} className="bg-white hover:bg-blue-50 transition-colors duration-200">
                      <td className="px-3 py-2 whitespace-nowrap">{formatDate(r.dateExpedition ?? r.Date ?? '')}</td>
                      <td className="px-3 py-2">{r.denominationUsuelle ?? r['Libellé Ressource'] ?? ''}</td>
                      <td className="px-3 py-2 text-center">{r.quantite ?? r.Quantité ?? ''}</td>
                      <td className="px-3 py-2 text-center">{r.codeUnite ?? r.Unité ?? ''}</td>
                      <td className="px-3 py-2">
                        <input
                          id={codeInputId}
                          name={codeInputId}
                          className="input w-24 text-center"
                          placeholder={suggestion || "170302"}
                          value={formatCodeDechet(r.codeDechet, r.danger)}
                          onChange={(e) => {
                            const idx = allRows.findIndex(row => row.__id === r.__id);
                            if (idx >= 0) {
                              const next = [...allRows];
                              const inputValue = e.target.value;
                              // Détecter si le code contient un astérisque
                              const { code, danger } = parseCodeInput(inputValue);
                              next[idx].codeDechet = code;
                              // Si l'astérisque est présent, cocher automatiquement la case danger
                              next[idx].danger = danger;
                              setAllRows(next);
                            }
                          }}
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          id={dangerInputId}
                          name={dangerInputId}
                          type="checkbox"
                          checked={r.danger === true}
                          onChange={(e) => {
                            const idx = allRows.findIndex(row => row.__id === r.__id);
                            if (idx >= 0) {
                              const next = [...allRows];
                              const isChecked = e.target.checked;
                              next[idx].danger = isChecked;
                              // Synchroniser l'astérisque dans le code déchet
                              if (next[idx].codeDechet) {
                                // Le code déchet sera formaté automatiquement avec l'astérisque via formatCodeDechet
                                // On garde juste le code propre dans codeDechet
                              }
                              setAllRows(next);
                            }
                          }}
                          className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                          title="Déchet dangereux"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex gap-2 justify-center">
                          {!hasValidCode && (
                            <button
                              className="rounded-lg px-3 py-1 text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all duration-200 border border-blue-300 hover:scale-105 active:scale-95"
                              onClick={() => handleAutoForRow(r)}
                              title="Appliquer la suggestion"
                            >
                              Suggestion
                            </button>
                          )}
                          {hasValidCode && (
                            <button
                              className="rounded-lg px-3 py-1 text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
                              onClick={() => handleValidateRow(r)}
                              title="Valider cette ligne"
                            >
                              Valider
                            </button>
                          )}
                        </div>
                      </td>
                      {editMode && (
                        <td className="px-3 py-2 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleModify(r)}
                              className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-gray-300 rounded transition-colors"
                              title="Modifier"
                            >
                              <EditIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(r.__id ?? i.toString())}
                              className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-300 rounded transition-colors"
                              title="Supprimer"
                            >
                              <TrashIcon className="w-4 h-4" />
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
        <div className="border-2 border-gray-200 rounded-xl p-6 bg-gray-50 animate-fade-in shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 transition-all duration-300">
            {rowsADefinir.length} Lignes à définir
          </h3>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-gray-100">
                <tr className="border-b-2 border-gray-300">
                  <SortableHeader 
                    label="Date" 
                    sortKey="date" 
                    currentSort={sortState} 
                    onSort={handleSort}
                    className="px-3 py-2"
                  />
                  <SortableHeader 
                    label="Dénomination" 
                    sortKey="denomination" 
                    currentSort={sortState} 
                    onSort={handleSort}
                    className="px-3 py-2"
                  />
                  <SortableHeader 
                    label="Quantité" 
                    sortKey="quantite" 
                    currentSort={sortState} 
                    onSort={handleSort}
                    className="px-3 py-2 text-center"
                  />
                  <SortableHeader 
                    label="Unité" 
                    sortKey="unite" 
                    currentSort={sortState} 
                    onSort={handleSort}
                    className="px-3 py-2 text-center"
                  />
                  <SortableHeader 
                    label="Code déchet" 
                    sortKey="codeDechet" 
                    currentSort={sortState} 
                    onSort={handleSort}
                    className="px-3 py-2 text-center"
                  />
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Danger</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  {editMode && <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Édition</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortRows(rowsADefinir, sortState?.key || null, sortState?.direction || null).map((r, i) => {
                  const rowIdentifier = getRowIdentifier(r, `gray-${i}`);
                  const codeInputId = `manual-code-${rowIdentifier}`;
                  const dangerInputId = `manual-danger-${rowIdentifier}`;
                  const hasValidCode = isValidCodeDechet(r.codeDechet);
                  return (
                    <tr key={rowIdentifier} className="bg-white hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-3 py-2 whitespace-nowrap">{formatDate(r.dateExpedition ?? r.Date ?? '')}</td>
                    <td className="px-3 py-2">{r.denominationUsuelle ?? r['Libellé Ressource'] ?? ''}</td>
                    <td className="px-3 py-2 text-center">{r.quantite ?? r.Quantité ?? ''}</td>
                    <td className="px-3 py-2 text-center">{r.codeUnite ?? r.Unité ?? ''}</td>
                    <td className="px-3 py-2">
                        <input
                          id={codeInputId}
                          name={codeInputId}
                          className="input w-24 text-center"
                          placeholder="Manuel"
                          value={formatCodeDechet(r.codeDechet, r.danger)}
                          onChange={(e) => {
                          const idx = allRows.findIndex(row => row.__id === r.__id);
                          if (idx >= 0) {
                            const next = [...allRows];
                            const inputValue = e.target.value;
                            // Détecter si le code contient un astérisque
                            const { code, danger } = parseCodeInput(inputValue);
                            next[idx].codeDechet = code;
                            // Si l'astérisque est présent, cocher automatiquement la case danger
                            next[idx].danger = danger;
                            setAllRows(next);
                          }
                        }}
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        id={dangerInputId}
                        name={dangerInputId}
                        type="checkbox"
                        checked={r.danger === true}
                        onChange={(e) => {
                          const idx = allRows.findIndex(row => row.__id === r.__id);
                          if (idx >= 0) {
                            const next = [...allRows];
                            const isChecked = e.target.checked;
                            next[idx].danger = isChecked;
                            // Synchroniser l'astérisque dans le code déchet
                            if (next[idx].codeDechet) {
                              // Le code déchet sera formaté automatiquement avec l'astérisque via formatCodeDechet
                              // On garde juste le code propre dans codeDechet
                            }
                            setAllRows(next);
                          }
                        }}
                        className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        title="Déchet dangereux"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      {hasValidCode ? (
                        <button
                          className="rounded-lg px-3 py-1 text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
                          onClick={() => handleValidateRow(r)}
                          title="Valider cette ligne"
                        >
                          Valider
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    {editMode && (
                      <td className="px-3 py-2 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleModify(r)}
                            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-gray-300 rounded transition-colors"
                            title="Modifier"
                          >
                            <EditIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(r.__id ?? i.toString())}
                            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-300 rounded transition-colors"
                            title="Supprimer"
                          >
                            <TrashIcon className="w-4 h-4" />
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

      {/* Tableau 3: Lignes validées (VERT) */}
      {rowsValidees.length > 0 && (
        <div className="border-2 border-green-200 rounded-xl p-6 bg-green-50 animate-fade-in shadow-sm">
          <h3 className="text-lg font-semibold text-green-900 mb-4 transition-all duration-300">
            {rowsValidees.length} Lignes avec code déchet validé
          </h3>
      <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-green-50">
                <tr className="border-b-2 border-green-200">
                  <SortableHeader 
                    label="Date" 
                    sortKey="date" 
                    currentSort={sortState} 
                    onSort={handleSort}
                    className="px-3 py-2"
                  />
                  <SortableHeader 
                    label="Dénomination" 
                    sortKey="denomination" 
                    currentSort={sortState} 
                    onSort={handleSort}
                    className="px-3 py-2"
                  />
                  <SortableHeader 
                    label="Quantité" 
                    sortKey="quantite" 
                    currentSort={sortState} 
                    onSort={handleSort}
                    className="px-3 py-2 text-center"
                  />
                  <SortableHeader 
                    label="Unité" 
                    sortKey="unite" 
                    currentSort={sortState} 
                    onSort={handleSort}
                    className="px-3 py-2 text-center"
                  />
                  <SortableHeader 
                    label="Code déchet" 
                    sortKey="codeDechet" 
                    currentSort={sortState} 
                    onSort={handleSort}
                    className="px-3 py-2 text-center"
                  />
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Danger</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                  {editMode && <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>}
                </tr>
          </thead>
              <tbody className="divide-y divide-green-200">
                {sortRows(rowsValidees, sortState?.key || null, sortState?.direction || null).map((r, i) => {
                  const rowIdentifier = getRowIdentifier(r, `green-${i}`);
                  const codeInputId = `validated-code-${rowIdentifier}`;
                  const dangerInputId = `validated-danger-${rowIdentifier}`;
                  return (
                    <tr key={rowIdentifier} className="bg-white hover:bg-green-50 transition">
                    <td className="px-3 py-2 whitespace-nowrap">{formatDate(r.dateExpedition ?? r.Date ?? '')}</td>
                    <td className="px-3 py-2">{r.denominationUsuelle ?? r['Libellé Ressource'] ?? ''}</td>
                    <td className="px-3 py-2 text-center">{r.quantite ?? r.Quantité ?? ''}</td>
                    <td className="px-3 py-2 text-center">{r.codeUnite ?? r.Unité ?? ''}</td>
                    <td className="px-3 py-2">
                      <input
                        id={codeInputId}
                        name={codeInputId}
                        className="input w-24 bg-white text-center"
                        value={formatCodeDechet(r.codeDechet, r.danger)}
                        onChange={(e) => {
                          const idx = allRows.findIndex(row => row.__id === r.__id);
                          if (idx >= 0) {
                            const next = [...allRows];
                            const inputValue = e.target.value;
                            // Détecter si le code contient un astérisque
                            const { code, danger } = parseCodeInput(inputValue);
                            next[idx].codeDechet = code;
                            // Si l'astérisque est présent, cocher automatiquement la case danger
                            next[idx].danger = danger;
                            setAllRows(next);
                          }
                        }}
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        id={dangerInputId}
                        name={dangerInputId}
                        type="checkbox"
                        checked={r.danger === true}
                        onChange={(e) => {
                          const idx = allRows.findIndex(row => row.__id === r.__id);
                          if (idx >= 0) {
                            const next = [...allRows];
                            const isChecked = e.target.checked;
                            next[idx].danger = isChecked;
                            // Synchroniser l'astérisque dans le code déchet
                            if (next[idx].codeDechet) {
                              // Le code déchet sera formaté automatiquement avec l'astérisque via formatCodeDechet
                              // On garde juste le code propre dans codeDechet
                            }
                            setAllRows(next);
                          }
                        }}
                        className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        title="Déchet dangereux"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="text-green-600 text-sm font-semibold">✓ Validée</span>
                    </td>
                    {editMode && (
                      <td className="px-3 py-2 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleModify(r)}
                            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-gray-300 rounded transition-colors"
                            title="Modifier"
                          >
                            <EditIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(r.__id ?? i.toString())}
                            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-300 rounded transition-colors"
                            title="Supprimer"
                          >
                            <TrashIcon className="w-4 h-4" />
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
  const baseId = row.__id ? `edit-${row.__id}` : 'edit-row';

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
            <label htmlFor={`${baseId}-date`} className="block text-sm font-medium text-gray-300 mb-2">Date</label>
            <input
              id={`${baseId}-date`}
              name={`${baseId}-date`}
              type="text"
              value={formatDate(edited.dateExpedition ?? edited.Date ?? '')}
              onChange={(e) => setEdited({ ...edited, dateExpedition: e.target.value, Date: e.target.value })}
              className="w-full rounded-lg bg-white/5 border border-white/20 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500 text-white placeholder-gray-500"
            />
          </div>
          <div>
            <label htmlFor={`${baseId}-quantite`} className="block text-sm font-medium text-gray-300 mb-2">Quantité</label>
            <input
              id={`${baseId}-quantite`}
              name={`${baseId}-quantite`}
              type="number"
              value={edited.quantite ?? edited.Quantité ?? ''}
              onChange={(e) => setEdited({ ...edited, quantite: e.target.value, Quantité: e.target.value })}
              className="w-full rounded-lg bg-white/5 border border-white/20 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500 text-white"
            />
          </div>
          <div>
            <label htmlFor={`${baseId}-unite`} className="block text-sm font-medium text-gray-300 mb-2">Unité</label>
            <input
              id={`${baseId}-unite`}
              name={`${baseId}-unite`}
              type="text"
              value={edited.codeUnite ?? edited.Unité ?? ''}
              onChange={(e) => setEdited({ ...edited, codeUnite: e.target.value, Unité: e.target.value })}
              className="w-full rounded-lg bg-white/5 border border-white/20 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500 text-white"
            />
          </div>
          <div>
            <label htmlFor={`${baseId}-code`} className="block text-sm font-medium text-gray-300 mb-2">Code Déchet</label>
            <input
              id={`${baseId}-code`}
              name={`${baseId}-code`}
              type="text"
              value={formatCodeDechet(edited.codeDechet, edited.danger)}
              onChange={(e) => {
                const inputValue = e.target.value;
                const { code, danger } = parseCodeInput(inputValue);
                setEdited({ ...edited, codeDechet: code, danger });
              }}
              className="w-full rounded-lg bg-white/5 border border-white/20 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500 text-white"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2" htmlFor={`${baseId}-danger`}>
              <input
                id={`${baseId}-danger`}
                name={`${baseId}-danger`}
                type="checkbox"
                checked={edited.danger === true}
                onChange={(e) => {
                  setEdited({ ...edited, danger: e.target.checked });
                }}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              Déchet dangereux
            </label>
          </div>
          <div>
            <label htmlFor={`${baseId}-ressource`} className="block text-sm font-medium text-gray-300 mb-2">Ressource</label>
            <textarea
              id={`${baseId}-ressource`}
              name={`${baseId}-ressource`}
              value={edited.denominationUsuelle ?? edited['Libellé Ressource'] ?? ''}
              onChange={(e) => setEdited({ ...edited, denominationUsuelle: e.target.value, 'Libellé Ressource': e.target.value })}
              className="w-full rounded-lg bg-white/5 border border-white/20 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500 text-white resize-none"
              rows={2}
            />
          </div>
          <div>
            <label htmlFor={`${baseId}-entite`} className="block text-sm font-medium text-gray-300 mb-2">Entité</label>
            <input
              id={`${baseId}-entite`}
              name={`${baseId}-entite`}
              type="text"
              value={edited['producteur.raisonSociale'] ?? edited['Libellé Entité'] ?? ''}
              onChange={(e) => setEdited({ ...edited, 'producteur.raisonSociale': e.target.value, 'Libellé Entité': e.target.value })}
              className="w-full rounded-lg bg-white/5 border border-white/20 px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500 text-white"
            />
          </div>
          <div>
            <label htmlFor={`${baseId}-chantier`} className="block text-sm font-medium text-gray-300 mb-2">Chantier</label>
            <input
              id={`${baseId}-chantier`}
              name={`${baseId}-chantier`}
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
