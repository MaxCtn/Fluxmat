'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface TableRow {
  id: number;
  exutoire: string | null;
  libelle_entite: string | null;
  libelle_chantier: string | null;
  code_chantier: string | null;
  date_expedition: string | null;
  quantite: number | null;
  unite: string | null;
  libelle_ressource: string | null;
  code_dechet: string | null;
}

function fmtDate(dateStr: string | null): string {
  if (!dateStr || dateStr === 'N/A') return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR');
  } catch {
    return dateStr;
  }
}

type SortField = 'exutoire' | 'libelle_entite' | 'date_expedition';
type SortOrder = 'asc' | 'desc';

export default function DashboardTable({ filters, showViewAll = true }: { filters: { etab?: string; chantier?: string; num?: string }; showViewAll?: boolean }) {
  const router = useRouter();
  const [items, setItems] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<SortField>('date_expedition');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.etab, filters.chantier, filters.num, sortBy, sortOrder]);

  async function loadItems() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.etab) params.append('etab', filters.etab);
      if (filters.chantier) params.append('chantier', filters.chantier);
      if (filters.num) params.append('num', filters.num);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      params.append('limit', '10'); // Limiter à 10 lignes pour l'aperçu

      const res = await fetch(`/api/dashboard/registre-flux?${params.toString()}`);
      const data = await res.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Erreur chargement tableau:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSort(field: SortField) {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortBy !== field) {
      return <span className="text-gray-400 dark:text-gray-500 text-xs ml-1">⇅</span>;
    }
    return <span className="text-gray-700 dark:text-gray-300 text-xs ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  }

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Chargement...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Aucune donnée trouvée dans le registre de flux
      </div>
    );
  }

  function handleViewAll() {
    const params = new URLSearchParams();
    if (filters.etab) params.append('etab', filters.etab);
    if (filters.chantier) params.append('chantier', filters.chantier);
    if (filters.num) params.append('num', filters.num);
    router.push(`/dashboard/full?${params.toString()}`);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">Aperçu (10 lignes maximum)</p>
        {showViewAll && (
          <button
            onClick={handleViewAll}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition"
          >
            Voir tout →
          </button>
        )}
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-800">
        <table className="w-full text-sm">
        <thead className="bg-gray-100 dark:bg-slate-900">
          <tr>
            <th 
              className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-800 transition"
              onClick={() => handleSort('exutoire')}
            >
              Exutoire <SortIcon field="exutoire" />
            </th>
            <th 
              className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-800 transition"
              onClick={() => handleSort('libelle_entite')}
            >
              Agence <SortIcon field="libelle_entite" />
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Chantier</th>
            <th 
              className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-800 transition"
              onClick={() => handleSort('date_expedition')}
            >
              Date <SortIcon field="date_expedition" />
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Quantité</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Ressource</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Code déchet</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
          {items.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-slate-900/50">
              <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{row.exutoire || '–'}</td>
              <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{row.libelle_entite || '–'}</td>
              <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                <div>
                  {row.libelle_chantier || '–'}
                  {row.code_chantier && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({row.code_chantier})</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{fmtDate(row.date_expedition)}</td>
              <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                {row.quantite ? `${row.quantite} ${row.unite || 'T'}` : '–'}
              </td>
              <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{row.libelle_ressource || '–'}</td>
              <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                {row.code_dechet ? (
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded text-xs font-semibold">
                    {row.code_dechet}
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded text-xs font-semibold">
                    Manquant
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

