'use client';

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

interface HierarchicalRow {
  etablissement: string;
  agence: string;
  chantier: string;
  exutoire: string;
  count: number;
  data: RowData[];
  contextPath: string;
}

interface HierarchicalDataViewProps {
  data: RowData[];
  title?: string;
  onClose?: () => void;
  onOpenTable?: (data: RowData[], title: string, contextPath: string) => void;
}

/**
 * Structure les données en lignes de tableau hiérarchique
 */
function buildTableRows(data: RowData[]): HierarchicalRow[] {
  const rows: HierarchicalRow[] = [];
  const seen = new Set<string>();

  for (const row of data) {
    const etab = row.etablissement || row['Code Entité'] || row['Code Entite'] || 'Non renseigné';
    const agence = row.agence || row['Libellé Entité'] || row['Libelle Entite'] || row['producteur.raisonSociale'] || 'Non renseigné';
    const chantier = row.chantier || row['Libellé Chantier'] || row['Libelle Chantier'] || row['producteur.adresse.libelle'] || 'Non renseigné';
    const exutoire = row.exutoire || row['Libellé Fournisseur'] || row['Libelle Fournisseur'] || row['destinataire.raisonSociale'] || 'Non renseigné';

    // Créer une clé unique pour cette combinaison hiérarchique
    const key = `${etab}|${agence}|${chantier}|${exutoire}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      // Collecter toutes les lignes avec cette combinaison
      const matchingRows = data.filter(r => {
        const rEtab = r.etablissement || r['Code Entité'] || r['Code Entite'] || 'Non renseigné';
        const rAgence = r.agence || r['Libellé Entité'] || r['Libelle Entite'] || r['producteur.raisonSociale'] || 'Non renseigné';
        const rChantier = r.chantier || r['Libellé Chantier'] || r['Libelle Chantier'] || r['producteur.adresse.libelle'] || 'Non renseigné';
        const rExutoire = r.exutoire || r['Libellé Fournisseur'] || r['Libelle Fournisseur'] || r['destinataire.raisonSociale'] || 'Non renseigné';
        return rEtab === etab && rAgence === agence && rChantier === chantier && rExutoire === exutoire;
      });

      rows.push({
        etablissement: etab,
        agence: agence,
        chantier: chantier,
        exutoire: exutoire,
        count: matchingRows.length,
        data: matchingRows,
        contextPath: `Établissement: ${etab} > Agence: ${agence} > Chantier: ${chantier} > Exutoire: ${exutoire}`
      });
    }
  }

  // Trier par établissement > agence > chantier > exutoire
  return rows.sort((a, b) => {
    if (a.etablissement !== b.etablissement) return a.etablissement.localeCompare(b.etablissement);
    if (a.agence !== b.agence) return a.agence.localeCompare(b.agence);
    if (a.chantier !== b.chantier) return a.chantier.localeCompare(b.chantier);
    return a.exutoire.localeCompare(b.exutoire);
  });
}

/**
 * Optimise l'affichage : si un niveau n'a pas de sous-niveaux, l'affiche dans le titre
 */
function optimizeDisplay(rows: HierarchicalRow[]): HierarchicalRow[] {
  const optimized: HierarchicalRow[] = [];
  const etabGroups = new Map<string, HierarchicalRow[]>();

  // Grouper par établissement
  for (const row of rows) {
    if (!etabGroups.has(row.etablissement)) {
      etabGroups.set(row.etablissement, []);
    }
    etabGroups.get(row.etablissement)!.push(row);
  }

  for (const [etab, etabRows] of etabGroups.entries()) {
    const agenceGroups = new Map<string, HierarchicalRow[]>();
    
    // Grouper par agence
    for (const row of etabRows) {
      if (!agenceGroups.has(row.agence)) {
        agenceGroups.set(row.agence, []);
      }
      agenceGroups.get(row.agence)!.push(row);
    }

    for (const [agence, agenceRows] of agenceGroups.entries()) {
      const chantierGroups = new Map<string, HierarchicalRow[]>();
      
      // Grouper par chantier
      for (const row of agenceRows) {
        if (!chantierGroups.has(row.chantier)) {
          chantierGroups.set(row.chantier, []);
        }
        chantierGroups.get(row.chantier)!.push(row);
      }

      for (const [chantier, chantierRows] of chantierGroups.entries()) {
        // Si un seul exutoire, on peut simplifier l'affichage
        if (chantierRows.length === 1 && chantierRows[0].exutoire !== 'Non renseigné') {
          const row = chantierRows[0];
          // Vérifier si on peut combiner avec le niveau supérieur
          if (agenceRows.length === 1 && etabRows.length === 1) {
            // Tout peut être combiné
            optimized.push({
              ...row,
              etablissement: `${row.etablissement} (${row.count} lignes)`,
              agence: '-',
              chantier: '-',
              exutoire: '-'
            });
          } else if (agenceRows.length === 1) {
            // Agence et chantier peuvent être combinés
            optimized.push({
              ...row,
              agence: `${row.agence} > ${row.chantier} (${row.count} lignes)`,
              chantier: '-',
              exutoire: '-'
            });
          } else {
            // Juste le chantier et l'exutoire
            optimized.push({
              ...row,
              chantier: `${row.chantier} > ${row.exutoire} (${row.count} lignes)`,
              exutoire: '-'
            });
          }
        } else {
          // Plusieurs exutoires, on garde tout
          optimized.push(...chantierRows);
        }
      }
    }
  }

  return optimized;
}

/**
 * Composant principal pour afficher les données de manière hiérarchique en tableau (modale)
 */
export default function HierarchicalDataView({ 
  data, 
  title = 'Vue hiérarchique',
  onClose,
  onOpenTable
}: HierarchicalDataViewProps) {
  const rows = optimizeDisplay(buildTableRows(data));
  const totalLignes = data.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">Total: {totalLignes} ligne{totalLignes > 1 ? 's' : ''}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {rows.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucune donnée à afficher</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Établissement
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agence
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chantier
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Exutoire
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lignes
                    </th>
                    {onOpenTable && (
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rows.map((row, idx) => (
                    <tr key={`${row.etablissement}-${row.agence}-${row.chantier}-${row.exutoire}-${idx}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {row.etablissement}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {row.agence === '-' ? <span className="text-gray-400">-</span> : row.agence}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {row.chantier === '-' ? <span className="text-gray-400">-</span> : row.chantier}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {row.exutoire === '-' ? <span className="text-gray-400">-</span> : row.exutoire}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap text-sm text-gray-900">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-sm font-semibold text-blue-700">
                          {row.count}
                        </span>
                      </td>
                      {onOpenTable && (
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                          <button
                            onClick={() => onOpenTable(row.data, row.etablissement, row.contextPath)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                          >
                            Ouvrir le tableau
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
