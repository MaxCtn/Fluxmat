'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface RowData {
  __id?: string;
  dateExpedition?: string;
  denominationUsuelle?: string;
  quantite?: number;
  codeUnite?: string;
  codeDechet?: string;
  etablissement?: string;
  agence?: string;
  chantier?: string;
  exutoire?: string;
  [key: string]: any;
}

interface EditableDataTableProps {
  data: RowData[];
  title: string;
  contextPath: string;
  onClose: () => void;
}

function normalizeCode(v: string): string {
  return (v || '').replace(/\D/g, '').slice(0, 6);
}

function formatDate(dateValue: any): string {
  if (!dateValue) return '-';
  if (typeof dateValue === 'string') {
    // Si c'est déjà au format DD/MM/YYYY ou similaire
    if (dateValue.includes('/')) return dateValue;
    // Essayer de parser
    const d = new Date(dateValue);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }
    return dateValue;
  }
  if (dateValue instanceof Date) {
    const dd = String(dateValue.getDate()).padStart(2, '0');
    const mm = String(dateValue.getMonth() + 1).padStart(2, '0');
    const yyyy = dateValue.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
  return String(dateValue);
}

export default function EditableDataTable({
  data,
  title,
  contextPath,
  onClose
}: EditableDataTableProps) {
  const router = useRouter();
  const [allRows, setAllRows] = useState<RowData[]>([]);
  const [editingRow, setEditingRow] = useState<RowData | null>(null);

  useEffect(() => {
    const updatedRows = data.map(r => ({ ...r }));
    setAllRows(updatedRows);
  }, [data]);

  function handleEdit(row: RowData) {
    setEditingRow({ ...row });
  }

  function handleSaveEdit() {
    if (!editingRow) return;
    const updated = allRows.map((r) => (r.__id === editingRow.__id ? editingRow : r));
    setAllRows(updated);
    setEditingRow(null);
  }

  function handleCancelEdit() {
    setEditingRow(null);
  }

  function handleCodeDechetChange(rowId: string, value: string) {
    const normalized = normalizeCode(value);
    const updated = allRows.map((r) =>
      r.__id === rowId ? { ...r, codeDechet: normalized } : r
    );
    setAllRows(updated);
  }

  function handleGoToControl() {
    // Séparer les données avec et sans code déchet
    const registre: RowData[] = [];
    const controle: RowData[] = [];

    allRows.forEach(row => {
      if (row.codeDechet && row.codeDechet.trim().length === 6) {
        registre.push(row);
      } else {
        controle.push(row);
      }
    });

    // Sauvegarder dans sessionStorage
    sessionStorage.setItem('fluxmat_data', JSON.stringify({
      registre,
      controle,
      fileName: 'Import hiérarchique'
    }));

    // Rediriger vers la page contrôle
    window.location.href = '/controle';
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">{contextPath}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {allRows.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucune donnée à afficher</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dénomination
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantité
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unité
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code déchet
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allRows.map((row, idx) => {
                    const isEditing = editingRow?.__id === row.__id;
                    
                    return (
                      <tr key={row.__id || idx} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(row.dateExpedition)}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {row.denominationUsuelle || row['Libellé Ressource'] || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {row.quantite || 0}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {row.codeUnite || row.unite || 'T'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                          {isEditing && editingRow ? (
                            <input
                              type="text"
                              value={editingRow.codeDechet || ''}
                              onChange={(e) => {
                                const normalized = normalizeCode(e.target.value);
                                setEditingRow({ ...editingRow, codeDechet: normalized });
                              }}
                              className="px-2 py-1 border border-gray-300 rounded text-sm font-mono w-24"
                              placeholder="000000"
                              maxLength={6}
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              {row.codeDechet && row.codeDechet.length === 6 ? (
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded font-mono">
                                  {row.codeDechet}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                          {isEditing ? (
                            <div className="flex gap-2">
                              <button
                                onClick={handleSaveEdit}
                                className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                              >
                                ✓
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500"
                              >
                                ✗
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEdit(row)}
                              className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                            >
                              Modifier
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            ← Retour
          </button>
          <button
            onClick={handleGoToControl}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-md"
          >
            Aller au contrôle →
          </button>
        </div>
      </div>
    </div>
  );
}

