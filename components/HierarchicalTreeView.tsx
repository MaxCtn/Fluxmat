'use client';

import React, { useState, useEffect } from 'react';
import SortableHeader, { SortDirection } from './SortableHeader';
import FilterableCodeDechetHeader, { CodeDechetFilter } from './FilterableCodeDechetHeader';
import { isDangerousCode, parseCodeDechetWithDanger, isValidCodeDechet } from '@/lib/wasteUtils';

interface RowData {
  __id?: string;
  dateExpedition?: string;
  denominationUsuelle?: string;
  quantite?: number;
  codeUnite?: string;
  codeDechet?: string;
  danger?: boolean; // Déchet dangereux ou non
  etablissement?: string;
  agence?: string;
  chantier?: string;
  exutoire?: string;
  typeCamion?: string | null;
  [key: string]: any;
}

interface HierarchicalRow {
  etablissement: string;
  agence: string;
  chantier: string;
  withCode: RowData[];
  withoutCode: RowData[];
  totalQuantite: number;
  unite: string;
  contextPath: string;
}

interface GroupedRow {
  date: string;
  dateNormalized: string; // Pour le tri
  denomination: string;
  exutoires: string[];
  quantiteTotal: number;
  unite: string;
  codeDechet: string | null;
  items: RowData[];
  groupKey: string;
}

interface HierarchicalTreeViewProps {
  data: RowData[];
  allRows?: RowData[]; // Toutes les lignes brutes du CSV (y compris les lignes de matériel)
  onDataChange?: (data: RowData[]) => void; // Callback quand les données changent (modif/suppression)
}

/**
 * Normalise le code déchet
 */
function normalizeCode(v: string): string {
  return (v || '').replace(/\D/g, '').slice(0, 6);
}

/**
 * Formate le code déchet pour l'affichage (ajoute l'astérisque si danger)
 */
function formatCodeDechet(code: string | undefined | null, danger: boolean | undefined): string {
  if (!code) return '';
  const cleanCode = code.replace(/\*/g, '').replace(/[\s\-]/g, '');
  if (danger === true) {
    return cleanCode + '*';
  }
  return cleanCode;
}

/**
 * Parse l'input utilisateur pour extraire le code et détecter le danger
 */
function parseCodeInput(value: string): { code: string; danger: boolean } {
  if (!value) return { code: '', danger: false };
  const trimmed = value.trim();
  const hasAsterisk = trimmed.endsWith('*') || trimmed.includes('*');
  const code = trimmed.replace(/\*/g, '').replace(/[\s\-]/g, '').slice(0, 6);
  return { code, danger: hasAsterisk };
}

/**
 * Structure les données en lignes de tableau hiérarchique (Établissement > Agence > Chantier)
 */
function buildTableRows(data: RowData[]): HierarchicalRow[] {
  const rowsMap = new Map<string, HierarchicalRow>();

  for (const row of data) {
    const etab = row.etablissement || row['Code Entité'] || row['Code Entite'] || 'Non renseigné';
    const agence = row.agence || row['Libellé Entité'] || row['Libelle Entite'] || row['producteur.raisonSociale'] || 'Non renseigné';
    const chantier = row.chantier || row['Libellé Chantier'] || row['Libelle Chantier'] || row['producteur.adresse.libelle'] || 'Non renseigné';

    // Clé unique pour cette combinaison hiérarchique (sans exutoire)
    const key = `${etab}|${agence}|${chantier}`;
    
    if (!rowsMap.has(key)) {
      rowsMap.set(key, {
        etablissement: etab,
        agence: agence,
        chantier: chantier,
        withCode: [],
        withoutCode: [],
        totalQuantite: 0,
        unite: row.codeUnite || row.unite || 'T',
        contextPath: `Établissement: ${etab} > Agence: ${agence} > Chantier: ${chantier}`
      });
    }

    const rowData = rowsMap.get(key)!;
    const hasCode = isValidCodeDechet(row.codeDechet);
    
    if (hasCode) {
      rowData.withCode.push(row);
    } else {
      rowData.withoutCode.push(row);
    }
    
    rowData.totalQuantite += Number(row.quantite || 0);
  }

  // Convertir en tableau et trier
  return Array.from(rowsMap.values()).sort((a, b) => {
    if (a.etablissement !== b.etablissement) return a.etablissement.localeCompare(b.etablissement);
    if (a.agence !== b.agence) return a.agence.localeCompare(b.agence);
    return a.chantier.localeCompare(b.chantier);
  });
}

/**
 * Formatage de date
 */
function formatDate(dateValue: any): string {
  if (!dateValue) return '-';
  if (typeof dateValue === 'string') {
    if (dateValue.includes('/')) return dateValue;
    const d = new Date(dateValue);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }
    return dateValue;
  }
  return String(dateValue);
}

/**
 * Normalise une date pour le tri (retourne un timestamp ou une chaîne comparable)
 */
function normalizeDateForSort(dateValue: any): string {
  if (!dateValue) return '0000-00-00';
  if (typeof dateValue === 'string') {
    // Si format DD/MM/YYYY
    if (dateValue.includes('/')) {
      const parts = dateValue.split('/');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    // Essayer de parser comme Date
    const d = new Date(dateValue);
    if (!isNaN(d.getTime())) {
      const yyyy = String(d.getFullYear());
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    return dateValue;
  }
  if (dateValue instanceof Date) {
    const yyyy = String(dateValue.getFullYear());
    const mm = String(dateValue.getMonth() + 1).padStart(2, '0');
    const dd = String(dateValue.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return String(dateValue);
}

/**
 * Récupère la dénomination d'une ligne
 */
function getDenomination(row: RowData): string {
  return row.denominationUsuelle || row['Libellé Ressource'] || row['Libelle Ressource'] || '-';
}

/**
 * Récupère l'exutoire d'une ligne
 */
function getExutoire(row: RowData): string {
  return row.exutoire || row['destinataire.raisonSociale'] || row['Libellé Fournisseur'] || row['Libelle Fournisseur'] || '-';
}

/**
 * Groupe les lignes par date + dénomination
 */
function groupByDateAndDenomination(items: RowData[]): GroupedRow[] {
  const groupedMap = new Map<string, GroupedRow>();

  for (const item of items) {
    const date = formatDate(item.dateExpedition);
    const dateNormalized = normalizeDateForSort(item.dateExpedition);
    const denomination = getDenomination(item);
    const groupKey = `${dateNormalized}|${denomination}`;

    if (!groupedMap.has(groupKey)) {
      groupedMap.set(groupKey, {
        date,
        dateNormalized,
        denomination,
        exutoires: [],
        quantiteTotal: 0,
        unite: item.codeUnite || item.unite || 'T',
        codeDechet: null,
        items: [],
        groupKey
      });
    }

    const group = groupedMap.get(groupKey)!;
    group.items.push(item);
    group.quantiteTotal += Number(item.quantite || 0);
    
    const exutoire = getExutoire(item);
    if (!group.exutoires.includes(exutoire)) {
      group.exutoires.push(exutoire);
    }

    // Vérifier si tous les codes déchets sont identiques
    if (isValidCodeDechet(item.codeDechet)) {
      const codeDechet = item.codeDechet || null;
      if (group.codeDechet === null) {
        group.codeDechet = codeDechet;
      } else if (group.codeDechet !== codeDechet) {
        group.codeDechet = 'Multiple';
      }
    }
  }

  return Array.from(groupedMap.values());
}

/**
 * Trie les lignes groupées selon la colonne et la direction
 */
function sortGroupedRows(
  groupedRows: GroupedRow[],
  sortKey: string | null,
  sortDirection: SortDirection
): GroupedRow[] {
  if (!sortKey || !sortDirection) {
    // Tri par défaut : date desc (plus récent en premier)
    return [...groupedRows].sort((a, b) => {
      const dateA = a.dateNormalized;
      const dateB = b.dateNormalized;
      return dateB.localeCompare(dateA);
    });
  }

  const sorted = [...groupedRows].sort((a, b) => {
    let comparison = 0;

    switch (sortKey) {
      case 'date':
        comparison = a.dateNormalized.localeCompare(b.dateNormalized);
        break;
      case 'denomination':
        comparison = a.denomination.localeCompare(b.denomination);
        break;
      case 'quantite':
        comparison = a.quantiteTotal - b.quantiteTotal;
        break;
      case 'unite':
        comparison = a.unite.localeCompare(b.unite);
        break;
      case 'codeDechet':
        const codeA = a.codeDechet || '';
        const codeB = b.codeDechet || '';
        comparison = codeA.localeCompare(codeB);
        break;
      default:
        return 0;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

/**
 * Trie les lignes individuelles selon la colonne et la direction
 */
function sortItems(
  items: RowData[],
  sortKey: string | null,
  sortDirection: SortDirection
): RowData[] {
  if (!sortKey || !sortDirection) {
    return items;
  }

  const sorted = [...items].sort((a, b) => {
    let comparison = 0;

    switch (sortKey) {
      case 'date':
        const dateA = normalizeDateForSort(a.dateExpedition);
        const dateB = normalizeDateForSort(b.dateExpedition);
        comparison = dateA.localeCompare(dateB);
        break;
      case 'denomination':
        comparison = getDenomination(a).localeCompare(getDenomination(b));
        break;
      case 'exutoire':
        comparison = getExutoire(a).localeCompare(getExutoire(b));
        break;
      case 'quantite':
        comparison = Number(a.quantite || 0) - Number(b.quantite || 0);
        break;
      case 'unite':
        const uniteA = a.codeUnite || a.unite || 'T';
        const uniteB = b.codeUnite || b.unite || 'T';
        comparison = uniteA.localeCompare(uniteB);
        break;
      case 'codeDechet':
        const codeA = a.codeDechet || '';
        const codeB = b.codeDechet || '';
        comparison = codeA.localeCompare(codeB);
        break;
      default:
        return 0;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

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

/**
 * Composant principal pour afficher les données de manière hiérarchique en tableau
 */
export default function HierarchicalTreeView({ data, allRows = [], onDataChange }: HierarchicalTreeViewProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set()); // Pour les groupes date+dénomination
  const [editingRow, setEditingRow] = useState<RowData | null>(null);
  const [localData, setLocalData] = useState<RowData[]>(data);
  const [sortState, setSortState] = useState<{ key: string; direction: SortDirection } | null>({
    key: 'date',
    direction: 'desc' // Par défaut : date desc (plus récent en premier)
  });
  const [codeDechetFilter, setCodeDechetFilter] = useState<CodeDechetFilter>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<RowData[]>([]);

  // Synchroniser localData avec les props si les données changent
  useEffect(() => {
    setLocalData(data);
  }, [data]);

  // Reconstruire les lignes à chaque changement de localData
  const rows = buildTableRows(localData);

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
  
  // Fonction pour obtenir toutes les données d'un groupe (mise à jour depuis localData)
  const getGroupData = (etablissement: string, agence: string, chantier: string) => {
    return localData.filter(row => {
      const etab = row.etablissement || row['Code Entité'] || row['Code Entite'] || 'Non renseigné';
      const ag = row.agence || row['Libellé Entité'] || row['Libelle Entite'] || row['producteur.raisonSociale'] || 'Non renseigné';
      const chant = row.chantier || row['Libellé Chantier'] || row['Libelle Chantier'] || row['producteur.adresse.libelle'] || 'Non renseigné';
      return etab === etablissement && ag === agence && chant === chantier;
    });
  };

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const handleEdit = (row: RowData) => {
    setEditingRow({ ...row });
  };

  const handleSaveEdit = () => {
    if (!editingRow) return;
    const updated = localData.map((r) => (r.__id === editingRow.__id ? editingRow : r));
    setLocalData(updated);
    setEditingRow(null);
    if (onDataChange) onDataChange(updated);
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
  };

  const handleDelete = (rowId: string) => {
    const updated = localData.filter((r) => r.__id !== rowId);
    setLocalData(updated);
    if (onDataChange) onDataChange(updated);
  };

  const handleCodeChange = (rowId: string, value: string) => {
    const normalized = normalizeCode(value);
    const updated = localData.map((r) =>
      r.__id === rowId ? { ...r, codeDechet: normalized } : r
    );
    setLocalData(updated);
    if (onDataChange) onDataChange(updated);
  };

  /**
   * Extrait le type de camion depuis les données brutes d'une ligne
   * Associe les lignes de "Pointage matériel" aux lignes de déchets par date et chantier
   */
  const extractTruckType = (row: RowData): string => {
    const backendType =
      row.typeCamion ??
      row.transportTruckType ??
      row['typeCamion'];
    if (backendType && String(backendType).trim().length > 0) {
      return String(backendType).trim();
    }
    
    // Si c'est déjà une ligne de pointage matériel, extraire directement
    const origine = row['Origine'] || row['Libellé Origine'] || row['Libelle Origine'] || '';
    if (String(origine).includes('Pointage matériel')) {
      const libelleRessource = row['Libellé Ressource'] || row['Libelle Ressource'] || row['Ressource'] || '';
      if (libelleRessource) {
        const truckDesc = String(libelleRessource).trim();
        if (truckDesc && truckDesc.length > 0) {
          return truckDesc;
        }
      }
    }
    
    // Sinon, chercher dans allRows (toutes les lignes brutes) les lignes de matériel associées
    // Associer par date et chantier
    const rowDateNormalized = normalizeDateForSort(row.dateExpedition || row['Date'] || '');
    const rowChantier = row.chantier || row['Libellé Chantier'] || row['Libelle Chantier'] || row['producteur.adresse.libelle'] || '';
    
    // Chercher les lignes de "Pointage matériel" avec la même date et le même chantier
    const materialRows = allRows.filter((materialRow: any) => {
      const materialOrigine = materialRow['Origine'] || materialRow['Libellé Origine'] || materialRow['Libelle Origine'] || '';
      if (!String(materialOrigine).includes('Pointage matériel')) return false;
      
      const materialDateNormalized = normalizeDateForSort(materialRow.dateExpedition || materialRow['Date'] || '');
      const materialChantier = materialRow.chantier || materialRow['Libellé Chantier'] || materialRow['Libelle Chantier'] || materialRow['producteur.adresse.libelle'] || '';
      
      return materialDateNormalized === rowDateNormalized && materialChantier === rowChantier;
    });
    
    // Si on trouve des lignes de matériel, extraire le type de camion
    if (materialRows.length > 0) {
      // Prendre la première ligne de matériel trouvée
      const materialRow = materialRows[0];
      const libelleRessource = materialRow['Libellé Ressource'] || materialRow['Libelle Ressource'] || materialRow['Ressource'] || '';
      if (libelleRessource) {
        const truckDesc = String(libelleRessource).trim();
        if (truckDesc && truckDesc.length > 0) {
          return truckDesc;
        }
      }
    }
    
    // Dernière tentative : chercher dans les colonnes de la ligne actuelle
    for (const key in row) {
      const value = String(row[key] || '');
      if (value.includes('MASTER') || value.includes('C 480') || value.includes('BENNE') || 
          value.includes('camion') || value.includes('transport') || value.includes('52026A') || value.includes('MH383')) {
        return value;
      }
    }
    
    return 'Non renseigné';
  };

  /**
   * Ouvre la modal avec les informations de transport pour une ou plusieurs lignes
   */
  const handleOpenTransportModal = (items: RowData[]) => {
    setModalData(items);
    setModalOpen(true);
  };

  if (localData.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-gray-500 text-center py-8">Aucune donnée à afficher</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 mb-8">
      {rows.map((row, idx) => {
        const rowKey = `${row.etablissement}|${row.agence}|${row.chantier}`;
        const totalLignes = row.withCode.length + row.withoutCode.length;
        
        // Récupérer les données à jour du groupe
        const groupData = getGroupData(row.etablissement, row.agence, row.chantier);
        
        // Filtrer selon le filtre code déchet
        let filteredData = groupData;
        if (codeDechetFilter === 'with') {
          filteredData = groupData.filter(r => isValidCodeDechet(r.codeDechet));
        } else if (codeDechetFilter === 'without') {
          filteredData = groupData.filter(r => !isValidCodeDechet(r.codeDechet));
        }
        
        // Grouper et trier les lignes
        const groupedRows = groupByDateAndDenomination(filteredData);
        const grouped = sortGroupedRows(groupedRows, sortState?.key || null, sortState?.direction || null);
        
        // Séparer les groupes : d'abord ceux avec code déchet, puis ceux sans
        const withCode = grouped.filter(g => g.codeDechet && g.codeDechet !== 'Multiple' && isValidCodeDechet(g.codeDechet));
        const withoutCode = grouped.filter(g => !g.codeDechet || g.codeDechet === 'Multiple' || !isValidCodeDechet(g.codeDechet));
        const sortedGrouped = [...withCode, ...withoutCode];
        
        if (totalLignes === 0) return null;
        
        return (
          <div key={rowKey} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            {/* Titre personnalisé */}
            <h2 className="text-xl font-semibold mb-6 text-gray-900">
              {row.etablissement} - {row.agence} - {row.chantier}
            </h2>
            
            {/* Tableau détaillé */}
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
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
                    <FilterableCodeDechetHeader 
                      label="Code déchet" 
                      filterValue={codeDechetFilter}
                      onFilterChange={setCodeDechetFilter}
                      className="px-3 py-2 text-center"
                    />
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Danger</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedGrouped.map((group) => {
                    const fullGroupKey = `${rowKey}-${group.groupKey}`;
                    const isGroupExpanded = expandedGroups.has(fullGroupKey);
                    const sortedItems = sortItems(group.items, sortState?.key || null, sortState?.direction || null);
                    
                    const hasMultipleItems = group.items.length > 1;
                    const singleItem = hasMultipleItems ? null : group.items[0];
                    const isEditingSingle = singleItem && editingRow?.__id === singleItem.__id;
                    
                    // Déterminer si le groupe a un code déchet valide
                    const hasValidCode = group.codeDechet && group.codeDechet !== 'Multiple' && isValidCodeDechet(group.codeDechet);
                    
                    return (
                      <React.Fragment key={fullGroupKey}>
                        <tr className={`hover:bg-gray-50 ${hasValidCode ? '' : 'bg-red-50'}`}>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {isEditingSingle && editingRow ? (
                              <input
                                name="group-date"
                                type="text"
                                value={editingRow.dateExpedition || ''}
                                onChange={(e) => setEditingRow({ ...editingRow, dateExpedition: e.target.value })}
                                placeholder="DD/MM/YYYY"
                                className="px-2 py-1 border border-gray-300 rounded text-sm w-28"
                              />
                            ) : (
                              group.date
                            )}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900 font-medium">
                            {isEditingSingle && editingRow ? (
                              <input
                                name="group-denomination"
                                type="text"
                                value={editingRow.denominationUsuelle || editingRow['Libellé Ressource'] || ''}
                                onChange={(e) => setEditingRow({ ...editingRow, denominationUsuelle: e.target.value, 'Libellé Ressource': e.target.value })}
                                className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
                              />
                            ) : (
                              group.denomination
                            )}
                          </td>
                          <td className="px-3 py-2 text-center whitespace-nowrap text-sm text-gray-900 font-medium">
                            {isEditingSingle && editingRow ? (
                              <input
                                name="group-quantity"
                                type="number"
                                value={editingRow.quantite || 0}
                                onChange={(e) => setEditingRow({ ...editingRow, quantite: Number(e.target.value) })}
                                min="0"
                                step="0.01"
                                className="px-2 py-1 border border-gray-300 rounded text-sm w-20 text-center"
                              />
                            ) : (
                              group.quantiteTotal.toFixed(2)
                            )}
                          </td>
                          <td className="px-3 py-2 text-center whitespace-nowrap text-sm text-gray-900">
                            {isEditingSingle && editingRow ? (
                              <select
                                value={editingRow.codeUnite || editingRow.unite || 'T'}
                                onChange={(e) => setEditingRow({ ...editingRow, codeUnite: e.target.value, unite: e.target.value })}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                              >
                                <option value="T">T</option>
                                <option value="kg">kg</option>
                                <option value="m³">m³</option>
                                <option value="L">L</option>
                              </select>
                            ) : (
                              group.unite
                            )}
                          </td>
                          <td className="px-3 py-2 text-center whitespace-nowrap text-sm">
                            {isEditingSingle && editingRow ? (
                              <input
                                name="group-code"
                                type="text"
                                value={formatCodeDechet(editingRow.codeDechet, editingRow.danger)}
                                onChange={(e) => {
                                  const inputValue = e.target.value;
                                  const { code, danger } = parseCodeInput(inputValue);
                                  setEditingRow({ 
                                    ...editingRow, 
                                    codeDechet: code,
                                    danger: danger
                                  });
                                }}
                                className="px-2 py-1 border border-gray-300 rounded text-sm font-mono w-24"
                                placeholder="000000"
                                maxLength={7}
                              />
                            ) : hasValidCode ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded font-mono">
                                {formatCodeDechet(group.codeDechet, singleItem?.danger)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center whitespace-nowrap text-sm">
                            {isEditingSingle && editingRow ? (
                              <input
                                name="group-danger-edit"
                                type="checkbox"
                                checked={editingRow.danger === true}
                                onChange={(e) => {
                                  const isChecked = e.target.checked;
                                  setEditingRow({ ...editingRow, danger: isChecked });
                                }}
                                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                title="Déchet dangereux"
                              />
                            ) : (
                              <input
                                name="group-danger-toggle"
                                type="checkbox"
                                checked={singleItem?.danger === true}
                                onChange={(e) => {
                                  if (singleItem?.__id) {
                                    const isChecked = e.target.checked;
                                    const updated = localData.map(r =>
                                      r.__id === singleItem.__id ? { ...r, danger: isChecked } : r
                                    );
                                    setLocalData(updated);
                                    if (onDataChange) onDataChange(updated);
                                  }
                                }}
                                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                title="Déchet dangereux"
                              />
                            )}
                          </td>
                          <td className="px-3 py-2 text-center whitespace-nowrap text-sm">
                            {hasMultipleItems ? (
                              <div className="flex gap-2 justify-center items-center">
                                <button
                                  onClick={() => handleOpenTransportModal(group.items)}
                                  className="p-1.5 text-gray-600 hover:text-purple-600 hover:bg-purple-50 border border-gray-300 rounded transition-colors"
                                  title="Informations de transport"
                                >
                                  🚛
                                </button>
                                <button
                                  onClick={() => toggleGroup(fullGroupKey)}
                                  className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                >
                                  {isGroupExpanded ? '▼ Réduire' : '▶ Voir détails'}
                                </button>
                              </div>
                            ) : singleItem ? (
                              isEditingSingle ? (
                                <div className="flex gap-2 justify-center">
                                  <button
                                    onClick={handleSaveEdit}
                                    className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                    title="Valider"
                                  >
                                    ✓
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500"
                                    title="Annuler"
                                  >
                                    ✗
                                  </button>
                                </div>
                              ) : (
                                <div className="flex gap-2 justify-center">
                                  <button
                                    onClick={() => handleOpenTransportModal([singleItem])}
                                    className="p-1.5 text-gray-600 hover:text-purple-600 hover:bg-purple-50 border border-gray-300 rounded transition-colors"
                                    title="Informations de transport"
                                  >
                                    🚛
                                  </button>
                                  <button
                                    onClick={() => handleEdit(singleItem)}
                                    className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-gray-300 rounded transition-colors"
                                    title="Modifier"
                                  >
                                    <EditIcon className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => singleItem.__id && handleDelete(singleItem.__id)}
                                    className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-300 rounded transition-colors"
                                    title="Supprimer"
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              )
                            ) : null}
                          </td>
                        </tr>
                        {isGroupExpanded && sortedItems.map((item, itemIdx) => {
                          const isEditing = editingRow?.__id === item.__id;
                          const itemHasCode = isValidCodeDechet(item.codeDechet);
                          return (
                            <tr key={item.__id || `item-${itemIdx}`} className={`hover:bg-gray-50 ${itemHasCode ? '' : 'bg-red-50'}`}>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600 pl-6">
                                {isEditing && editingRow ? (
                                  <input
                                    name="item-date"
                                    type="text"
                                    value={editingRow.dateExpedition || ''}
                                    onChange={(e) => setEditingRow({ ...editingRow, dateExpedition: e.target.value })}
                                    placeholder="DD/MM/YYYY"
                                    className="px-2 py-1 border border-gray-300 rounded text-sm w-28"
                                  />
                                ) : (
                                  formatDate(item.dateExpedition)
                                )}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-600">
                                {isEditing && editingRow ? (
                                  <input
                                    name="item-denomination"
                                    type="text"
                                    value={editingRow.denominationUsuelle || editingRow['Libellé Ressource'] || ''}
                                    onChange={(e) => setEditingRow({ ...editingRow, denominationUsuelle: e.target.value, 'Libellé Ressource': e.target.value })}
                                    className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
                                  />
                                ) : (
                                  item.denominationUsuelle || item['Libellé Ressource'] || '-'
                                )}
                              </td>
                              <td className="px-3 py-2 text-center whitespace-nowrap text-sm text-gray-600">
                                {isEditing && editingRow ? (
                                  <input
                                    name="item-quantity"
                                    type="number"
                                    value={editingRow.quantite || 0}
                                    onChange={(e) => setEditingRow({ ...editingRow, quantite: Number(e.target.value) })}
                                    min="0"
                                    step="0.01"
                                    className="px-2 py-1 border border-gray-300 rounded text-sm w-20 text-center"
                                  />
                                ) : (
                                  item.quantite || 0
                                )}
                              </td>
                              <td className="px-3 py-2 text-center whitespace-nowrap text-sm text-gray-600">
                                {isEditing && editingRow ? (
                                  <select
                                    value={editingRow.codeUnite || editingRow.unite || 'T'}
                                    onChange={(e) => setEditingRow({ ...editingRow, codeUnite: e.target.value, unite: e.target.value })}
                                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                                  >
                                    <option value="T">T</option>
                                    <option value="kg">kg</option>
                                    <option value="m³">m³</option>
                                    <option value="L">L</option>
                                  </select>
                                ) : (
                                  item.codeUnite || item.unite || 'T'
                                )}
                              </td>
                              <td className="px-3 py-2 text-center whitespace-nowrap text-sm">
                                {isEditing && editingRow ? (
                                  <input
                                    name="item-code"
                                    type="text"
                                    value={formatCodeDechet(editingRow.codeDechet, editingRow.danger)}
                                    onChange={(e) => {
                                      const inputValue = e.target.value;
                                      const { code, danger } = parseCodeInput(inputValue);
                                      setEditingRow({ 
                                        ...editingRow, 
                                        codeDechet: code,
                                        danger: danger
                                      });
                                    }}
                                    className="px-2 py-1 border border-gray-300 rounded text-sm font-mono w-24"
                                    placeholder="000000"
                                    maxLength={7}
                                  />
                                ) : itemHasCode ? (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded font-mono">
                                    {formatCodeDechet(item.codeDechet, item.danger)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-center whitespace-nowrap text-sm">
                                {isEditing && editingRow ? (
                                  <input
                                    name="item-danger-edit"
                                    type="checkbox"
                                    checked={editingRow.danger === true}
                                    onChange={(e) => {
                                      const isChecked = e.target.checked;
                                      setEditingRow({ ...editingRow, danger: isChecked });
                                    }}
                                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                    title="Déchet dangereux"
                                  />
                                ) : (
                                  <input
                                    name="item-danger-toggle"
                                    type="checkbox"
                                    checked={item.danger === true}
                                    onChange={(e) => {
                                      if (item.__id) {
                                        const isChecked = e.target.checked;
                                        const updated = localData.map(r =>
                                          r.__id === item.__id ? { ...r, danger: isChecked } : r
                                        );
                                        setLocalData(updated);
                                        if (onDataChange) onDataChange(updated);
                                      }
                                    }}
                                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                    title="Déchet dangereux"
                                  />
                                )}
                              </td>
                              <td className="px-3 py-2 text-center whitespace-nowrap text-sm">
                                {isEditing && editingRow ? (
                                  <div className="flex gap-2 justify-center">
                                    <button
                                      onClick={handleSaveEdit}
                                      className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                      title="Valider"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      onClick={handleCancelEdit}
                                      className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500"
                                      title="Annuler"
                                    >
                                      ✗
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex gap-2 justify-center">
                                    <button
                                      onClick={() => handleOpenTransportModal([item])}
                                      className="p-1.5 text-gray-600 hover:text-purple-600 hover:bg-purple-50 border border-gray-300 rounded transition-colors"
                                      title="Informations de transport"
                                    >
                                      🚛
                                    </button>
                                    <button
                                      onClick={() => handleEdit(item)}
                                      className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-gray-300 rounded transition-colors"
                                      title="Modifier"
                                    >
                                      <EditIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => item.__id && handleDelete(item.__id)}
                                      className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-300 rounded transition-colors"
                                      title="Supprimer"
                                    >
                                      <TrashIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Modal pour afficher les informations de transport */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Informations de transport</h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Fermer"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                {modalData.map((item, idx) => {
                  const exutoire = item.exutoire || item['destinataire.raisonSociale'] || item['Libellé Fournisseur'] || item['Libelle Fournisseur'] || 'Non renseigné';
                  const truckType = extractTruckType(item);
                  
                  return (
                    <div key={item.__id || idx} className="border border-gray-200 rounded-lg p-4">
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-gray-700">Exutoire :</span>
                          <span className="ml-2 text-sm text-gray-900">{exutoire}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Type de camion :</span>
                          <span className="ml-2 text-sm text-gray-900">{truckType}</span>
                        </div>
                        {item.denominationUsuelle && (
                          <div>
                            <span className="text-sm font-medium text-gray-700">Dénomination :</span>
                            <span className="ml-2 text-sm text-gray-900">{item.denominationUsuelle}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
