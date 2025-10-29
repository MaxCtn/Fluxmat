'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import Papa from 'papaparse';
import { saveAs } from '../../../components/saveAsCsv';

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

function FullDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [items, setItems] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(100);
  
  const [sortBy, setSortBy] = useState<SortField>('date_expedition');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Filtres
  const [filters, setFilters] = useState({
    etab: searchParams.get('etab') || '',
    chantier: searchParams.get('chantier') || '',
    num: searchParams.get('num') || '',
    exutoire: '',
    code_dechet: '',
    date_from: '',
    date_to: '',
    quantite_min: '',
    quantite_max: '',
  });

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortBy, sortOrder, filters]);

  async function loadItems() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.etab) params.append('etab', filters.etab);
      if (filters.chantier) params.append('chantier', filters.chantier);
      if (filters.num) params.append('num', filters.num);
      if (filters.exutoire) params.append('exutoire', filters.exutoire);
      if (filters.code_dechet) params.append('code_dechet', filters.code_dechet);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      params.append('limit', String(pageSize));
      params.append('offset', String((page - 1) * pageSize));

      const res = await fetch(`/api/dashboard/registre-flux?${params.toString()}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotalCount(data.total || data.count || data.items?.length || 0);
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
    setPage(1);
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortBy !== field) {
      return <span className="text-gray-400 dark:text-gray-500 text-xs ml-1">⇅</span>;
    }
    return <span className="text-gray-700 dark:text-gray-300 text-xs ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  }

  function handleExportCSV() {
    // Charger toutes les données pour l'export (sans pagination)
    const params = new URLSearchParams();
    if (filters.etab) params.append('etab', filters.etab);
    if (filters.chantier) params.append('chantier', filters.chantier);
    if (filters.num) params.append('num', filters.num);
    if (filters.exutoire) params.append('exutoire', filters.exutoire);
    if (filters.code_dechet) params.append('code_dechet', filters.code_dechet);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    params.append('sortBy', sortBy);
    params.append('sortOrder', sortOrder);
    params.append('limit', '10000'); // Limite élevée pour export

    fetch(`/api/dashboard/registre-flux?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        const csv = Papa.unparse(data.items || []);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        saveAs(blob, `registre_flux_${Date.now()}.csv`);
      })
      .catch(err => {
        console.error('Erreur export CSV:', err);
        alert('Erreur lors de l\'export CSV');
      });
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <main className="min-h-dvh bg-gray-50 dark:bg-[#1C1C1C] transition-colors">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">Registre de flux — Vue complète</h1>
            <p className="text-gray-600 dark:text-gray-400">Tableau complet avec filtres avancés et pagination</p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-900 rounded-lg border border-gray-300 dark:border-slate-700 transition"
          >
            ← Retour
          </button>
        </div>

        {/* Filtres avancés */}
        <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#1C1C1C] p-6 mb-6 shadow-sm transition-colors">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Filtres avancés</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Établissement (code)</label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 transition-colors"
                value={filters.etab}
                onChange={(e) => {
                  setFilters({ ...filters, etab: e.target.value });
                  setPage(1);
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chantier (code)</label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 transition-colors"
                value={filters.chantier}
                onChange={(e) => setFilters({ ...filters, chantier: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">N° Chantier</label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 transition-colors"
                value={filters.num}
                onChange={(e) => setFilters({ ...filters, num: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Exutoire</label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 transition-colors"
                value={filters.exutoire}
                onChange={(e) => setFilters({ ...filters, exutoire: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code déchet</label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 transition-colors"
                value={filters.code_dechet}
                onChange={(e) => setFilters({ ...filters, code_dechet: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date de début</label>
              <input
                type="date"
                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 transition-colors"
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date de fin</label>
              <input
                type="date"
                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 transition-colors"
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantité min</label>
              <input
                type="number"
                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 transition-colors"
                value={filters.quantite_min}
                onChange={(e) => setFilters({ ...filters, quantite_min: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => {
                const newFilters = {
                  etab: searchParams.get('etab') || '',
                  chantier: searchParams.get('chantier') || '',
                  num: searchParams.get('num') || '',
                  exutoire: '',
                  code_dechet: '',
                  date_from: '',
                  date_to: '',
                  quantite_min: '',
                  quantite_max: '',
                };
                setFilters(newFilters);
                setPage(1);
              }}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-900 rounded-lg border border-gray-300 dark:border-slate-700 transition"
            >
              Réinitialiser
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 text-sm bg-green-600 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-600 rounded-lg transition"
            >
              📥 Exporter CSV
            </button>
          </div>
        </div>

        {/* Tableau */}
        <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#1C1C1C] p-6 mb-6 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Résultats ({totalCount} lignes)
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Chargement...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Aucune donnée trouvée</div>
          ) : (
            <>
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Page {page} sur {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-900 rounded-lg border border-gray-300 dark:border-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ← Précédent
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-900 rounded-lg border border-gray-300 dark:border-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Suivant →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}

export default function FullDashboardPage() {
  return (
    <Suspense fallback={
      <main className="min-h-dvh bg-gray-50">
        <Header />
        <section className="mx-auto max-w-7xl px-4 py-10">
          <div className="text-center py-8 text-gray-500">Chargement...</div>
        </section>
        <Footer />
      </main>
    }>
      <FullDashboardContent />
    </Suspense>
  );
}

