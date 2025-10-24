'use client';

import { useState, useEffect } from 'react';

interface FilterData {
  exutoires: string[];
  natures: string[];
  ressources: string[];
}

interface DepenseRow {
  id: number;
  libelle_fournisseur?: string;
  libelle_nature_gestion?: string;
  libelle_ressource?: string;
  quantite?: number;
  montant?: number;
  [key: string]: any;
}

export default function DatabaseFilter() {
  const [brut, setBrut] = useState(false);
  const [filters, setFilters] = useState<FilterData>({
    exutoires: [],
    natures: [],
    ressources: [],
  });
  
  const [selectedFilters, setSelectedFilters] = useState({
    exutoire: '',
    natures: [] as string[],
    ressources: [] as string[],
  });
  
  const [data, setData] = useState<DepenseRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);

  // Charger les listes de filtres disponibles
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const fetchOptions = (action: string) => ({
          method: 'POST' as const,
          headers: {
            'Content-Type': 'application/json',
            ...(brut ? { 'x-brut': 'true' } : {}),
          },
          body: JSON.stringify({ action }),
        });
        
        const [exutoireRes, naturesRes, ressourcesRes] = await Promise.all([
          fetch('/api/db/filtered', fetchOptions('get_exutoires')),
          fetch('/api/db/filtered', fetchOptions('get_natures')),
          fetch('/api/db/filtered', fetchOptions('get_ressources')),
        ]);

        const exutoireData = await exutoireRes.json();
        const naturesData = await naturesRes.json();
        const ressourcesData = await ressourcesRes.json();

        setFilters({
          exutoires: exutoireData.exutoires || [],
          natures: naturesData.natures || [],
          ressources: ressourcesData.ressources || [],
        });
      } catch (error) {
        console.error('Erreur lors du chargement des filtres:', error);
      }
    };

    loadFilters();
  }, [brut]);

  // Charger les données filtrées
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        
        if (selectedFilters.exutoire) {
          params.append('exutoire', selectedFilters.exutoire);
        }
        
        selectedFilters.natures.forEach(n => {
          params.append('nature_gestion', n);
        });
        
        selectedFilters.ressources.forEach(r => {
          params.append('ressource', r);
        });
        
        params.append('brut', brut.toString());

        const response = await fetch(`/api/db/filtered?${params.toString()}`);
        const result = await response.json();
        
        setData(result.data || []);
        setCount(result.count || 0);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedFilters, brut]);

  const handleExutoireChange = (exutoire: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      exutoire: prev.exutoire === exutoire ? '' : exutoire,
    }));
  };

  const handleNatureToggle = (nature: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      natures: prev.natures.includes(nature)
        ? prev.natures.filter(n => n !== nature)
        : [...prev.natures, nature],
    }));
  };

  const handleRessourceToggle = (ressource: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      ressources: prev.ressources.includes(ressource)
        ? prev.ressources.filter(r => r !== ressource)
        : [...prev.ressources, ressource],
    }));
  };

  const resetFilters = () => {
    setSelectedFilters({
      exutoire: '',
      natures: [],
      ressources: [],
    });
  };

  const getNatureCategory = (nature: string) => {
    if (nature?.includes('02-')) return '02-Matériaux';
    if (nature?.includes('03-')) return '03-Matériel interne';
    if (nature?.includes('04-')) return '04-Matériel externe';
    if (nature?.includes('07-')) return '07-Sous-traitants/Presta';
    return nature;
  };

  return (
    <div className="w-full p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">📊 Base de Données FluxMat</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setBrut(false)}
              className={`px-4 py-2 rounded ${
                !brut
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              Données Propres ✓
            </button>
            <button
              onClick={() => setBrut(true)}
              className={`px-4 py-2 rounded ${
                brut
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              Données Brutes 📄
            </button>
          </div>
        </div>

        {/* Filtre 1 : Exutoire (Carrière) */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">🏭 Filtre 1 : Exutoire (Carrière)</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.exutoires.map(exutoire => (
              <button
                key={exutoire}
                onClick={() => handleExutoireChange(exutoire)}
                className={`px-4 py-2 rounded transition ${
                  selectedFilters.exutoire === exutoire
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {exutoire}
              </button>
            ))}
          </div>
        </div>

        {/* Filtre 2 : Nature Gestion */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">🚚 Filtre 2 : Libellé Nature Gestion</h3>
          <div className="space-y-2">
            {['02-Matériaux', '03-Matériel interne', '04-Matériel externe', '07-Sous-traitants/Presta'].map(
              category => {
                const matching = filters.natures.filter(n => getNatureCategory(n) === category);
                return (
                  <div key={category} className="bg-gray-100 p-3 rounded">
                    <div className="font-semibold text-sm mb-2">{category}</div>
                    <div className="flex flex-wrap gap-2">
                      {matching.map(nature => (
                        <label key={nature} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedFilters.natures.includes(nature)}
                            onChange={() => handleNatureToggle(nature)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{nature}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* Filtre 3 : Ressource */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">📦 Filtre 3 : Libellé Ressource</h3>
          <div className="space-y-2">
            {filters.ressources.map(ressource => (
              <label key={ressource} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedFilters.ressources.includes(ressource)}
                  onChange={() => handleRessourceToggle(ressource)}
                  className="w-4 h-4"
                />
                <span className="text-sm">
                  {ressource === 'Déblais' && '⬆️'}
                  {ressource === 'Pierre' && '⬇️'}
                  {ressource === 'Cailloux' && '⬇️'}
                  {ressource === 'Granulats' && '⬇️'} {ressource}
                </span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={resetFilters}
          className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          ✕ Réinitialiser les filtres
        </button>
      </div>

      {/* Affichage des résultats */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">
          📋 Résultats : {count} ligne{count > 1 ? 's' : ''}
        </h3>

        {loading ? (
          <div className="text-center py-8">Chargement...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Aucune donnée trouvée</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 p-2 text-left">Fournisseur</th>
                  <th className="border border-gray-300 p-2 text-left">Chantier</th>
                  <th className="border border-gray-300 p-2 text-left">Ressource</th>
                  <th className="border border-gray-300 p-2 text-left">Nature Gestion</th>
                  <th className="border border-gray-300 p-2 text-right">Quantité</th>
                  <th className="border border-gray-300 p-2 text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr key={row.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 p-2">{row.libelle_fournisseur || '-'}</td>
                    <td className="border border-gray-300 p-2">{row.libelle_chantier || '-'}</td>
                    <td className="border border-gray-300 p-2">{row.libelle_ressource || '-'}</td>
                    <td className="border border-gray-300 p-2">{row.libelle_nature_gestion || '-'}</td>
                    <td className="border border-gray-300 p-2 text-right">
                      {row.quantite ? Number(row.quantite).toFixed(2) : '-'}
                    </td>
                    <td className="border border-gray-300 p-2 text-right font-semibold">
                      {row.montant ? Number(row.montant).toFixed(2) + ' €' : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
