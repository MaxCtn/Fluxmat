/* eslint-disable @typescript-eslint/no-explicit-any */
import { getValue } from './csvParser';

export type ParsedCsvRow = Record<string, any>;

/**
 * Liste des chapitres comptables autorisés
 */
const CHAPITRES_AUTORISES = [
  'MATERIAUX & CONSOMMABLES',
  'MATERIEL',
  'S/T & PRESTATAIRES',
  'S/T PRODUITS NON SOUMIS A FGX'
];

/**
 * Liste des sous-chapitres comptables EXCLUS
 */
const SOUS_CHAPITRES_EXCLUS = [
  'ACIERS',
  'CONSOMMABLES',
  'FRAIS ANNEXES MATERIEL'
];

/**
 * Liste des rubriques comptables autorisées (EXACTEMENT ces valeurs)
 */
const RUBRIQUES_AUTORISEES = [
  'Agregats',
  'AMENAGT ESPACES VERT',
  'Autres prestations',
  'Balisage',
  'Enrobes a froid',
  'Fraisat',
  'Loc camions',
  'Loc int. camions',
  'Loc int. mat transport',
  'Loc materiel de transport',
  'Loc materiel divers',
  'Materiaux divers',
  'Materiaux recycles',
  'Mise decharge materiaux divers',
  'Prestation environnement',
  'Produits de voirie',
  'SABLE',
  'Sous traitance tiers',
  'STPD tiers',
  'Traitement dechets inertes'
];

/**
 * Cherche une valeur dans toutes les colonnes possibles (par nom et par position)
 */
function findValueInRow(row: ParsedCsvRow, possibleNames: string[], possiblePositions: number[]): any {
  // Essayer d'abord par nom (détection automatique ou en-têtes)
  for (const name of possibleNames) {
    const value = getValue(row, [name]);
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }
  
  // Ensuite essayer par position (col_X)
  for (const pos of possiblePositions) {
    const value = row[`col_${pos}`];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }
  
  // Essayer toutes les colonnes col_X jusqu'à 50 (pour couvrir les fichiers larges)
  // et chercher les valeurs qui correspondent aux patterns attendus
  for (let i = 0; i < 50; i++) {
    const value = row[`col_${i}`];
    if (value !== undefined && value !== null) {
      const valueStr = String(value).trim();
      // Vérifier si cette valeur correspond à ce qu'on cherche
      // (sera vérifié par l'appelant)
      if (valueStr !== '') {
        // Pour origine, vérifier si c'est une valeur attendue
        if (possibleNames.includes('Origine') || possibleNames.includes('origine')) {
          if (['Pointage personnel', 'Pointage matériel', 'Réception', 'Ecarts'].includes(valueStr)) {
            return value;
          }
        }
        // Pour chapitre, vérifier si c'est dans la liste autorisée
        if (possibleNames.some(n => n.toLowerCase().includes('chapitre'))) {
          if (CHAPITRES_AUTORISES.includes(valueStr)) {
            return value;
          }
        }
        // Pour rubrique, vérifier si c'est dans la liste autorisée
        if (possibleNames.some(n => n.toLowerCase().includes('rubrique'))) {
          if (RUBRIQUES_AUTORISEES.includes(valueStr)) {
            return value;
          }
        }
      }
    }
  }
  
  return undefined;
}

/**
 * Vérifie si une ligne passe les filtres métier selon les règles Power Query
 * 
 * Une ligne est RETENUE seulement si TOUTES les conditions suivantes sont vraies :
 * 1. Origine !== "Pointage personnel"
 * 2. Chapitre Comptable dans la liste autorisée
 * 3. Sous-chapitre Comptable n'est PAS dans la liste exclue
 * 4. Rubrique Comptable est EXACTEMENT une des valeurs autorisées
 * 
 * Sinon la ligne est SUPPRIMÉE
 */
export function passesFilter(row: ParsedCsvRow): boolean {
  // 1. ORIGINE
  // SUPPRIMÉ si Origine = "Pointage personnel"
  // RETENU si Origine est différente de "Pointage personnel"
  const origine = findValueInRow(row, 
    ['Origine', 'origine', 'Libellé Chapitre Comptable'], // Noms possibles
    [6, 7, 8] // Positions possibles (col_6 semble être la bonne d'après l'exemple)
  );
  
  if (origine && String(origine).trim() === 'Pointage personnel') {
    return false;
  }
  
  // 2. CHAPITRE COMPTABLE
  // RETENU uniquement si le Libellé Chapitre Comptable est dans cette liste :
  // Il y a deux occurrences dans le CSV (origine et modifié), on cherche la deuxième
  const chapitre = findValueInRow(row, [
    'Libellé Chapitre Comptable',
    'Libelle Chapitre Comptable',
    'libellé chapitre comptable',
    'libelle chapitre comptable',
    'chapitre comptable'
  ], [11, 13, 15, 17, 19]); // Plusieurs positions possibles (il y a des doublons dans le CSV)
  
  if (!chapitre) {
    return false;
  }
  
  const chapitreStr = String(chapitre).trim();
  if (!CHAPITRES_AUTORISES.includes(chapitreStr)) {
    return false;
  }
  
  // 3. SOUS-CHAPITRE COMPTABLE
  // SUPPRIMÉ si le Libellé Sous-chapitre Comptable est l'un de :
  //   - "ACIERS"
  //   - "CONSOMMABLES"
  //   - "FRAIS ANNEXES MATERIEL"
  // RETENU sinon
  const sousChapitre = findValueInRow(row, [
    'Libellé Sous-chapitre Comptable',
    'Libelle Sous-chapitre Comptable',
    'libellé sous-chapitre comptable',
    'libelle sous-chapitre comptable',
    'sous-chapitre comptable'
  ], [12, 14, 16, 18, 20]); // Plusieurs positions possibles
  
  if (sousChapitre) {
    const sousChapitreStr = String(sousChapitre).trim();
    if (SOUS_CHAPITRES_EXCLUS.includes(sousChapitreStr)) {
      return false;
    }
  }
  
  // 4. RUBRIQUE COMPTABLE
  // RETENU uniquement si Libellé Rubrique Comptable est EXACTEMENT
  // l'une des valeurs ci-dessous.
  // Il y a deux occurrences dans le CSV (origine et modifié), on cherche la deuxième
  const rubrique = findValueInRow(row, [
    'Libellé Rubrique Comptable',
    'Libelle Rubrique Comptable',
    'libellé rubrique comptable',
    'libelle rubrique comptable',
    'rubrique comptable'
  ], [10, 11, 14, 15, 17, 18]); // Plusieurs positions possibles
  
  if (!rubrique) {
    return false;
  }
  
  const rubriqueStr = String(rubrique).trim();
  if (!RUBRIQUES_AUTORISEES.includes(rubriqueStr)) {
    return false;
  }
  
  // Toutes les conditions sont remplies
  return true;
}

/**
 * Obtient les valeurs de filtrage depuis une ligne (pour debug/logging)
 */
export function getFilterValues(row: ParsedCsvRow): {
  origine: string | null;
  chapitre: string | null;
  sousChapitre: string | null;
  rubrique: string | null;
  passes: boolean;
} {
  const origine = getValue(row, ['Origine', 'origine', 'col_6']);
  const chapitre = getValue(row, [
    'Libellé Chapitre Comptable',
    'Libelle Chapitre Comptable',
    'libellé chapitre comptable',
    'libelle chapitre comptable',
    'chapitre comptable',
    'col_11',
    'col_15'
  ]);
  const sousChapitre = getValue(row, [
    'Libellé Sous-chapitre Comptable',
    'Libelle Sous-chapitre Comptable',
    'libellé sous-chapitre comptable',
    'libelle sous-chapitre comptable',
    'sous-chapitre comptable',
    'col_12',
    'col_16'
  ]);
  const rubrique = getValue(row, [
    'Libellé Rubrique Comptable',
    'Libelle Rubrique Comptable',
    'libellé rubrique comptable',
    'libelle rubrique comptable',
    'rubrique comptable',
    'col_10',
    'col_14'
  ]);
  
  return {
    origine: origine ? String(origine).trim() : null,
    chapitre: chapitre ? String(chapitre).trim() : null,
    sousChapitre: sousChapitre ? String(sousChapitre).trim() : null,
    rubrique: rubrique ? String(rubrique).trim() : null,
    passes: passesFilter(row)
  };
}

/**
 * Exporte les listes pour utilisation ailleurs
 */
export const FILTER_CONFIG = {
  CHAPITRES_AUTORISES,
  SOUS_CHAPITRES_EXCLUS,
  RUBRIQUES_AUTORISEES
};

