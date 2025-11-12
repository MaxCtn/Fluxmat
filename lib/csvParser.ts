/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Parser CSV/TSV automatique avec détection du délimiteur
 * Gère les fichiers avec ou sans en-tête
 */

export type ParsedCsvRow = Record<string, any>;
export type ParseCsvResult = {
  rows: ParsedCsvRow[];
  headers: string[];
  delimiter: string;
  hasHeaders: boolean;
};

/**
 * Détecte le délimiteur le plus probable dans la première ligne
 */
function detectDelimiter(firstLine: string): string {
  const delimiters = ['\t', ';', ','];
  const counts: Record<string, number> = {};
  
  for (const delim of delimiters) {
    counts[delim] = (firstLine.match(new RegExp('\\' + delim, 'g')) || []).length;
  }
  
  // Retourne le délimiteur le plus fréquent
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 && sorted[0][1] > 0 ? sorted[0][0] : '\t';
}

/**
 * Parse une ligne CSV en tenant compte des guillemets
 */
function parseLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Guillemet échappé
        currentField += '"';
        i++; // Skip le prochain guillemet
      } else {
        // Début/fin de champ entre guillemets
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      // Nouveau champ
      fields.push(currentField);
      currentField = '';
    } else if (char === '\n' || char === '\r') {
      // Fin de ligne
      if (!inQuotes) {
        fields.push(currentField);
        return fields;
      } else {
        currentField += char;
      }
    } else {
      currentField += char;
    }
  }
  
  // Ajouter le dernier champ
  fields.push(currentField);
  return fields;
}

/**
 * Détecte si la première ligne est un en-tête
 * Heuristique : si les valeurs sont principalement des textes (pas de dates/nombres)
 */
function detectHeaders(firstRow: string[], sampleRow?: string[]): boolean {
  if (!sampleRow) return false;
  
  // Si les deux premières lignes sont identiques, ce n'est probablement pas un en-tête
  if (firstRow.length === sampleRow.length && 
      firstRow.every((val, i) => val === sampleRow[i])) {
    return false;
  }
  
  // Si la première ligne contient principalement des mots-clés d'en-tête typiques
  const headerKeywords = ['code', 'libelle', 'libellé', 'date', 'quantite', 'quantité', 
                         'origine', 'chapitre', 'rubrique', 'fournisseur', 'chantier'];
  const firstRowLower = firstRow.join(' ').toLowerCase();
  const keywordMatches = headerKeywords.filter(kw => firstRowLower.includes(kw)).length;
  
  return keywordMatches >= 2;
}

/**
 * Nettoie une valeur (trim, convertit les valeurs vides en null)
 */
function cleanValue(value: string): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

/**
 * Génère des noms de colonnes génériques
 */
function generateColumnNames(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `col_${i}`);
}

/**
 * Détecte automatiquement les positions des colonnes importantes en analysant le contenu
 */
function detectColumnPositions(sampleRows: string[][]): Record<string, number> {
  const positions: Record<string, number> = {};
  
  // Mots-clés pour détecter les colonnes importantes
  const patterns: Record<string, string[]> = {
    'Origine': ['Pointage personnel', 'Pointage matériel', 'Réception', 'Ecarts'],
    'Libellé Chapitre Comptable': ['MATERIEL', 'MATERIAUX & CONSOMMABLES', 'S/T & PRESTATAIRES', 'S/T PRODUITS NON SOUMIS A FGX', 'PERSONNEL'],
    'Libellé Sous-chapitre Comptable': ['MATERIEL PROPRE', 'MATERIEL LOUE', 'MAIN D\'OEUVRE  HORAIRE', 'ENCADREMENT', 'BETONS, MORTIERS, AGREGATS', 'CONSOMMABLES'],
    'Libellé Rubrique Comptable': ['Loc camions', 'Loc int. camions', 'Loc materiel de transport', 'Loc materiel divers', 'Ciments & mortiers', 'SABLE', 'Agregats', 'Autres prestations']
  };
  
  // Analyser les premières lignes (max 10) pour trouver les patterns
  const rowsToAnalyze = Math.min(sampleRows.length, 10);
  
  for (const [columnName, keywords] of Object.entries(patterns)) {
    // Pour chaque colonne potentielle
    const maxCol = Math.max(...sampleRows.slice(0, rowsToAnalyze).map(r => r.length));
    
    for (let colIndex = 0; colIndex < maxCol; colIndex++) {
      let matchCount = 0;
      
      // Vérifier combien de lignes ont une valeur correspondant aux keywords
      for (let rowIndex = 0; rowIndex < rowsToAnalyze; rowIndex++) {
        if (sampleRows[rowIndex] && sampleRows[rowIndex][colIndex]) {
          const value = String(sampleRows[rowIndex][colIndex]).trim();
          if (keywords.some(kw => value === kw || value.includes(kw))) {
            matchCount++;
          }
        }
      }
      
      // Si au moins 30% des lignes correspondent, on a trouvé la colonne
      if (matchCount >= rowsToAnalyze * 0.3 && !positions[columnName]) {
        positions[columnName] = colIndex;
        break;
      }
    }
  }
  
  return positions;
}

/**
 * Parse un fichier CSV/TSV
 */
export function parseCsv(content: string): ParseCsvResult {
  // Normaliser les fins de ligne
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Détecter le délimiteur depuis la première ligne
  const firstLine = normalized.split('\n')[0] || '';
  const delimiter = detectDelimiter(firstLine);
  
  // Parser toutes les lignes
  const lines = normalized.split('\n').filter(line => line.trim() !== '');
  if (lines.length === 0) {
    return { rows: [], headers: [], delimiter, hasHeaders: false };
  }
  
  // Parser les premières lignes pour détecter les colonnes
  const firstRows: string[][] = [];
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    firstRows.push(parseLine(lines[i], delimiter));
  }
  
  // Détecter automatiquement les positions des colonnes importantes
  const detectedPositions = detectColumnPositions(firstRows);
  
  // Parser la première ligne
  const firstRow = parseLine(lines[0], delimiter);
  
  // Détecter si c'est un en-tête
  let headers: string[] = [];
  let hasHeaders = false;
  let dataStartIndex = 0;
  
  if (lines.length > 1) {
    const secondRow = parseLine(lines[1], delimiter);
    hasHeaders = detectHeaders(firstRow, secondRow);
    
    if (hasHeaders) {
      headers = firstRow.map(h => cleanValue(h) || `col_${dataStartIndex++}`).filter((h): h is string => h !== null);
      dataStartIndex = 1; // Commencer à la deuxième ligne
    } else {
      // Pas d'en-tête, générer des noms de colonnes
      headers = generateColumnNames(firstRow.length);
      dataStartIndex = 0; // Commencer à la première ligne
    }
  } else {
    // Une seule ligne, pas d'en-tête probable
    headers = generateColumnNames(firstRow.length);
    dataStartIndex = 0;
  }
  
  // Ajouter les noms de colonnes détectées automatiquement
  for (const [columnName, position] of Object.entries(detectedPositions)) {
    if (position < headers.length) {
      headers[position] = columnName;
      // Garder aussi col_X pour compatibilité
      if (!headers.includes(`col_${position}`)) {
        // Ajouter un alias
        console.log(`[CSV-PARSER] Colonne détectée: ${columnName} à la position ${position}`);
      }
    }
  }
  
  // Parser les lignes de données
  const rows: ParsedCsvRow[] = [];
  
  for (let i = dataStartIndex; i < lines.length; i++) {
    const rowFields = parseLine(lines[i], delimiter);
    
    // Créer un objet avec les colonnes détectées
    const row: ParsedCsvRow = {};
    
    // Mapper chaque champ à sa colonne
    for (let j = 0; j < headers.length && j < rowFields.length; j++) {
      const value = cleanValue(rowFields[j]);
      row[headers[j]] = value;
      // Toujours ajouter col_X aussi pour compatibilité
      row[`col_${j}`] = value;
    }
    
    // Si plus de champs que de colonnes, les ajouter avec des noms génériques
    if (rowFields.length > headers.length) {
      for (let j = headers.length; j < rowFields.length; j++) {
        row[`col_${j}`] = cleanValue(rowFields[j]);
      }
    }
    
    rows.push(row);
  }
  
  return {
    rows,
    headers,
    delimiter,
    hasHeaders
  };
}

/**
 * Normalise une clé de colonne pour la recherche flexible
 */
export function normalizeKey(key: string): string {
  return (key || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .trim();
}

/**
 * Trouve une valeur dans un objet en cherchant parmi plusieurs noms possibles
 */
export function getValue(row: ParsedCsvRow, possibleKeys: string[]): any {
  // Essayer d'abord les clés exactes
  for (const key of possibleKeys) {
    if (row[key] !== undefined && row[key] !== null) {
      return row[key];
    }
  }
  
  // Essayer avec normalisation
  const normalizedRow: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) {
    normalizedRow[normalizeKey(k)] = v;
  }
  
  for (const key of possibleKeys) {
    const normalized = normalizeKey(key);
    if (normalizedRow[normalized] !== undefined && normalizedRow[normalized] !== null) {
      return normalizedRow[normalized];
    }
  }
  
  return undefined;
}

