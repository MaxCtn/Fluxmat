'use client';
import { useState, useEffect } from 'react';

interface TableRow {
  exutoire: string;
  numChantier: string;
  date: string;
  dateLastImport: string;
}

function fmtDate(dateStr: string): string {
  if (!dateStr || dateStr === 'N/A') return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR');
  } catch {
    return dateStr;
  }
}

export default function DashboardTable({ filters }: { filters: { etab?: string; chantier?: string; num?: string } }) {
  const [items, setItems] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadItems();
  }, [filters.etab, filters.chantier, filters.num]);

  async function loadItems() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.etab) params.append('etab', filters.etab);
      if (filters.chantier) params.append('chantier', filters.chantier);

      const res = await fetch(`/api/dashboard/recent-imports?${params.toString()}`);
      const data = await res.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Erreur chargement tableau:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Chargement...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Aucun import récent trouvé
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-gray-900">Exutoire</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-900">Num-chantier</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-900">Date</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-900">Date dernier import</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {items.map((row, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-4 py-3 text-gray-700">{row.exutoire}</td>
              <td className="px-4 py-3 text-gray-700">{row.numChantier}</td>
              <td className="px-4 py-3 text-gray-700">{fmtDate(row.date)}</td>
              <td className="px-4 py-3 text-gray-700">{fmtDate(row.dateLastImport)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

