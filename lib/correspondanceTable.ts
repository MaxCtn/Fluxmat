/**
 * Table de correspondance pour les suggestions de codes déchet
 * Basée sur le fichier Table_de_correspondance__3_fichiers_.csv
 */

export interface CorrespondanceItem {
  source: 'ATELIER' | 'LABO' | 'DEPOT';
  termeRetrouve: string;
  formulationCatalogue: string;
  codeDechet: string; // Format "13 02 05*" (avec espaces)
  danger: boolean;
}

// Table de correspondance chargée depuis le CSV
let CORRESPONDANCE_TABLE: CorrespondanceItem[] = [];

/**
 * Charge la table de correspondance depuis le CSV
 * Le CSV doit être dans le dossier public ou chargé côté serveur
 */
export async function loadCorrespondanceTable(): Promise<void> {
  try {
    // Charger le CSV depuis le dossier public
    // Le fichier doit être dans public/csventré/Table_de_correspondance__3_fichiers_.csv
    const response = await fetch('/csventré/Table_de_correspondance__3_fichiers_.csv');
    if (!response.ok) {
      console.warn('[CORRESPONDANCE] Impossible de charger le CSV depuis /csventré/, utilisation de la table intégrée');
      loadEmbeddedTable();
      return;
    }
    
    const csvText = await response.text();
    parseCorrespondanceCSV(csvText);
    console.log('[CORRESPONDANCE] Table chargée depuis le CSV');
  } catch (error) {
    console.warn('[CORRESPONDANCE] Erreur lors du chargement du CSV, utilisation de la table intégrée', error);
    loadEmbeddedTable();
  }
}

/**
 * Parse le CSV de correspondance
 */
function parseCorrespondanceCSV(csvText: string): void {
  const lines = csvText.split('\n').filter(line => line.trim());
  const items: CorrespondanceItem[] = [];
  
  // Ignorer la première ligne (en-têtes)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parser la ligne CSV (gérer les guillemets)
    const fields = parseCSVLine(line);
    if (fields.length < 5) continue;
    
    const source = fields[0]?.trim() as 'ATELIER' | 'LABO' | 'DEPOT';
    const termeRetrouve = fields[1]?.trim() || '';
    const formulationCatalogue = fields[2]?.trim() || '';
    const codeDechet = fields[3]?.trim() || '';
    const dangerStr = fields[4]?.trim().toLowerCase();
    // Accepter "vrai", "true", "1" pour true et "faux", "false", "0" pour false
    const danger = dangerStr === 'true' || dangerStr === 'vrai' || dangerStr === '1';
    
    if (source && termeRetrouve && codeDechet) {
      items.push({
        source,
        termeRetrouve,
        formulationCatalogue,
        codeDechet,
        danger
      });
    }
  }
  
  CORRESPONDANCE_TABLE = items;
  console.log(`[CORRESPONDANCE] ${items.length} entrées chargées`);
}

/**
 * Parse une ligne CSV en gérant les guillemets
 */
function parseCSVLine(line: string): string[] {
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
    } else if (char === ',' && !inQuotes) {
      // Nouveau champ
      fields.push(currentField);
      currentField = '';
    } else {
      currentField += char;
    }
  }
  
  // Ajouter le dernier champ
  fields.push(currentField);
  return fields;
}

/**
 * Charge la table intégrée (fallback si le CSV n'est pas disponible)
 */
function loadEmbeddedTable(): void {
  // Table intégrée basée sur le CSV fourni
  CORRESPONDANCE_TABLE = [
    { source: 'ATELIER', termeRetrouve: 'Huiles noires', formulationCatalogue: 'Huile moteur/boite de vitesse usagée', codeDechet: '13 02 05*', danger: true },
    { source: 'ATELIER', termeRetrouve: 'huile de vidange', formulationCatalogue: 'Huile moteur/boite de vitesse usagée', codeDechet: '13 02 05*', danger: true },
    { source: 'ATELIER', termeRetrouve: 'huile noire usagée', formulationCatalogue: 'Huile moteur/boite de vitesse usagée', codeDechet: '13 02 05*', danger: true },
    { source: 'ATELIER', termeRetrouve: 'eau+boue hydrocarburées', formulationCatalogue: 'Mélange eau et boue des séparateurs à hydrocarbures', codeDechet: '13 05 08*', danger: true },
    { source: 'ATELIER', termeRetrouve: 'mélange eau et boue des séparateurs hydrocarbures', formulationCatalogue: 'Mélange eau et boue des séparateurs à hydrocarbures', codeDechet: '13 05 08*', danger: true },
    { source: 'ATELIER', termeRetrouve: 'produit fontaine à solvant', formulationCatalogue: 'Produit fontaine dégraissage', codeDechet: '14 06 03*', danger: true },
    { source: 'ATELIER', termeRetrouve: 'emballages (vides) souillés', formulationCatalogue: 'Emballages souillés', codeDechet: '15 01 10*', danger: true },
    { source: 'ATELIER', termeRetrouve: 'bidons de Marline vides par exemple', formulationCatalogue: 'Emballages souillés', codeDechet: '15 01 10*', danger: true },
    { source: 'ATELIER', termeRetrouve: 'emballages ayant contenu un produit dangereux', formulationCatalogue: 'Emballages souillés', codeDechet: '15 01 10*', danger: true },
    { source: 'ATELIER', termeRetrouve: 'absorbants/matériaux/matériels souillés', formulationCatalogue: 'Absorbants, EPI souillés aux produits dangereux y compris amiante', codeDechet: '15 02 02*', danger: true },
    { source: 'ATELIER', termeRetrouve: 'chiffons souillés aux produits dangereux', formulationCatalogue: 'Absorbants, EPI souillés aux produits dangereux y compris amiante', codeDechet: '15 02 02*', danger: true },
    { source: 'ATELIER', termeRetrouve: 'Filtre à huile et à carburant', formulationCatalogue: 'Filtres à huile', codeDechet: '16 01 07*', danger: true },
    { source: 'ATELIER', termeRetrouve: 'évacuation de liquide de refroidissement', formulationCatalogue: 'Liquide refroidissement, antigel usagés', codeDechet: '16 01 14*', danger: true },
    { source: 'ATELIER', termeRetrouve: 'DEEE en mélange', formulationCatalogue: 'Déchets électriques, électroniques - DEEE (16 02 13 *)', codeDechet: '16 02 13*', danger: false },
    { source: 'ATELIER', termeRetrouve: 'aérosols', formulationCatalogue: 'Aérosols', codeDechet: '16 05 04*', danger: true },
    { source: 'ATELIER', termeRetrouve: 'batterie au plomb', formulationCatalogue: 'Batteries au plomb', codeDechet: '16 06 01*', danger: true },
    { source: 'ATELIER', termeRetrouve: 'terre souillée', formulationCatalogue: 'Terre souillée', codeDechet: '17 05 03*', danger: true },
    { source: 'ATELIER', termeRetrouve: 'terre polluée', formulationCatalogue: 'Terre souillée', codeDechet: '17 05 03*', danger: true },
    { source: 'ATELIER', termeRetrouve: 'sol pollué', formulationCatalogue: 'Terre souillée', codeDechet: '17 05 03*', danger: true },
    { source: 'ATELIER', termeRetrouve: 'piles', formulationCatalogue: 'Piles et accumulateurs', codeDechet: '20 01 33*', danger: true },
    { source: 'ATELIER', termeRetrouve: 'accumulateurs', formulationCatalogue: 'Piles et accumulateurs', codeDechet: '20 01 33*', danger: true },
    { source: 'ATELIER', termeRetrouve: 'béton bitumineux contenant du goudron', formulationCatalogue: 'Mélanges bitumineux contenant du goudron (17 03 01 *)', codeDechet: '17 03 01*', danger: false },
    { source: 'ATELIER', termeRetrouve: 'mélange bitumineux contenant du goudron', formulationCatalogue: 'Mélanges bitumineux contenant du goudron (17 03 01 *)', codeDechet: '17 03 01*', danger: false },
    { source: 'ATELIER', termeRetrouve: 'enrobé pollué aux HAP', formulationCatalogue: 'Mélanges bitumineux contenant du goudron (17 03 01 *)', codeDechet: '17 03 01*', danger: false },
    { source: 'ATELIER', termeRetrouve: 'Matériaux amiantés', formulationCatalogue: 'Matériaux amiantés', codeDechet: '17 06 05*', danger: true },
    { source: 'ATELIER', termeRetrouve: 'canalisation amiante-ciment', formulationCatalogue: 'Matériaux amiantés', codeDechet: '17 06 05*', danger: true },
    { source: 'ATELIER', termeRetrouve: 'enrobés amiantés', formulationCatalogue: 'Matériaux amiantés', codeDechet: '17 06 05*', danger: true },
    { source: 'ATELIER', termeRetrouve: 'tuyau fibrociment', formulationCatalogue: 'Matériaux amiantés', codeDechet: '17 06 05*', danger: true },
    { source: 'ATELIER', termeRetrouve: 'dalle et colle amiantées', formulationCatalogue: 'Matériaux amiantés', codeDechet: '17 06 05*', danger: true },
    { source: 'ATELIER', termeRetrouve: 'Solvant non chloré', formulationCatalogue: 'Solvant non chloré', codeDechet: '07 01 04*', danger: true },
    { source: 'ATELIER', termeRetrouve: 'solvant chloré', formulationCatalogue: 'Solvant chloré', codeDechet: '14 06 02*', danger: true },
    // LABO
    { source: 'LABO', termeRetrouve: 'Solvant non chloré', formulationCatalogue: 'Solvant non chloré', codeDechet: '07 01 04*', danger: true },
    { source: 'LABO', termeRetrouve: 'solvant chloré', formulationCatalogue: 'Solvant chloré', codeDechet: '14 06 02*', danger: true },
    { source: 'LABO', termeRetrouve: 'emballages (vides) souillés', formulationCatalogue: 'Emballages souillés', codeDechet: '15 01 10*', danger: true },
    { source: 'LABO', termeRetrouve: 'bidons de Marline vides par exemple', formulationCatalogue: 'Emballages souillés', codeDechet: '15 01 10*', danger: true },
    { source: 'LABO', termeRetrouve: 'emballages ayant contenu un produit dangereux', formulationCatalogue: 'Emballages souillés', codeDechet: '15 01 10*', danger: true },
    { source: 'LABO', termeRetrouve: 'absorbants/matériaux/matériels souillés', formulationCatalogue: 'Absorbants, EPI souillés aux produits dangereux y compris amiante', codeDechet: '15 02 02*', danger: true },
    { source: 'LABO', termeRetrouve: 'chiffons souillés aux produits dangereux', formulationCatalogue: 'Absorbants, EPI souillés aux produits dangereux y compris amiante', codeDechet: '15 02 02*', danger: true },
    { source: 'LABO', termeRetrouve: 'DEEE en mélange', formulationCatalogue: 'Déchets électriques, électroniques - DEEE (16 02 13 *)', codeDechet: '16 02 13*', danger: false },
    { source: 'LABO', termeRetrouve: 'aérosols', formulationCatalogue: 'Aérosols', codeDechet: '16 05 04*', danger: true },
    { source: 'LABO', termeRetrouve: 'béton bitumineux contenant du goudron', formulationCatalogue: 'Mélanges bitumineux contenant du goudron (17 03 01 *)', codeDechet: '17 03 01*', danger: false },
    { source: 'LABO', termeRetrouve: 'mélange bitumineux contenant du goudron', formulationCatalogue: 'Mélanges bitumineux contenant du goudron (17 03 01 *)', codeDechet: '17 03 01*', danger: false },
    { source: 'LABO', termeRetrouve: 'enrobé pollué aux HAP', formulationCatalogue: 'Mélanges bitumineux contenant du goudron (17 03 01 *)', codeDechet: '17 03 01*', danger: false },
    // DEPOT
    { source: 'DEPOT', termeRetrouve: 'emballages (vides) souillés', formulationCatalogue: 'Emballages souillés', codeDechet: '15 01 10*', danger: true },
    { source: 'DEPOT', termeRetrouve: 'bidons de Marline vides par exemple', formulationCatalogue: 'Emballages souillés', codeDechet: '15 01 10*', danger: true },
    { source: 'DEPOT', termeRetrouve: 'emballages ayant contenu un produit dangereux', formulationCatalogue: 'Emballages souillés', codeDechet: '15 01 10*', danger: true },
    { source: 'DEPOT', termeRetrouve: 'absorbants/matériaux/matériels souillés', formulationCatalogue: 'Absorbants, EPI souillés aux produits dangereux y compris amiante', codeDechet: '15 02 02*', danger: true },
    { source: 'DEPOT', termeRetrouve: 'chiffons souillés aux produits dangereux', formulationCatalogue: 'Absorbants, EPI souillés aux produits dangereux y compris amiante', codeDechet: '15 02 02*', danger: true },
    { source: 'DEPOT', termeRetrouve: 'DEEE en mélange', formulationCatalogue: 'Déchets électriques, électroniques - DEEE (16 02 13 *)', codeDechet: '16 02 13*', danger: false },
    { source: 'DEPOT', termeRetrouve: 'aérosols', formulationCatalogue: 'Aérosols', codeDechet: '16 05 04*', danger: true },
    { source: 'DEPOT', termeRetrouve: 'béton bitumineux contenant du goudron', formulationCatalogue: 'Mélanges bitumineux contenant du goudron (17 03 01 *)', codeDechet: '17 03 01*', danger: false },
    { source: 'DEPOT', termeRetrouve: 'mélange bitumineux contenant du goudron', formulationCatalogue: 'Mélanges bitumineux contenant du goudron (17 03 01 *)', codeDechet: '17 03 01*', danger: false },
    { source: 'DEPOT', termeRetrouve: 'enrobé pollué aux HAP', formulationCatalogue: 'Mélanges bitumineux contenant du goudron (17 03 01 *)', codeDechet: '17 03 01*', danger: false },
    { source: 'DEPOT', termeRetrouve: 'terre souillée', formulationCatalogue: 'Terre souillée', codeDechet: '17 05 03*', danger: true },
    { source: 'DEPOT', termeRetrouve: 'terre polluée', formulationCatalogue: 'Terre souillée', codeDechet: '17 05 03*', danger: true },
    { source: 'DEPOT', termeRetrouve: 'sol pollué', formulationCatalogue: 'Terre souillée', codeDechet: '17 05 03*', danger: true },
    { source: 'DEPOT', termeRetrouve: 'Matériaux amiantés', formulationCatalogue: 'Matériaux amiantés', codeDechet: '17 06 05*', danger: true },
    { source: 'DEPOT', termeRetrouve: 'canalisation amiante-ciment', formulationCatalogue: 'Matériaux amiantés', codeDechet: '17 06 05*', danger: true },
    { source: 'DEPOT', termeRetrouve: 'enrobés amiantés', formulationCatalogue: 'Matériaux amiantés', codeDechet: '17 06 05*', danger: true },
    { source: 'DEPOT', termeRetrouve: 'tuyau fibrociment', formulationCatalogue: 'Matériaux amiantés', codeDechet: '17 06 05*', danger: true },
    { source: 'DEPOT', termeRetrouve: 'dalle et colle amiantées', formulationCatalogue: 'Matériaux amiantés', codeDechet: '17 06 05*', danger: true },
    { source: 'DEPOT', termeRetrouve: 'Solvant non chloré', formulationCatalogue: 'Solvant non chloré', codeDechet: '07 01 04*', danger: true },
    { source: 'DEPOT', termeRetrouve: 'solvant chloré', formulationCatalogue: 'Solvant chloré', codeDechet: '14 06 02*', danger: true },
  ];
  console.log(`[CORRESPONDANCE] ${CORRESPONDANCE_TABLE.length} entrées intégrées chargées`);
}

/**
 * Normalise un texte pour la recherche (comme dans wasteUtils)
 */
function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '') // Supprime les accents
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ') // Remplace caractères spéciaux par espaces
    .replace(/\s+/g, ' ') // Normalise les espaces multiples
    .trim();
}

/**
 * Recherche un code déchet dans la table de correspondance
 * @param label Libellé à rechercher
 * @param source Source optionnelle (ATELIER, LABO, DEPOT)
 * @returns CorrespondanceItem ou null
 */
export function findInCorrespondanceTable(
  label: string | undefined,
  source?: 'ATELIER' | 'LABO' | 'DEPOT'
): CorrespondanceItem | null {
  if (!label) return null;
  
  const normalizedLabel = normalizeText(label);
  
  // Si une source est spécifiée, chercher d'abord dans cette source
  if (source) {
    for (const item of CORRESPONDANCE_TABLE) {
      if (item.source === source) {
        const normalizedTerme = normalizeText(item.termeRetrouve);
        // Recherche exacte ou partielle
        if (normalizedLabel.includes(normalizedTerme) || normalizedTerme.includes(normalizedLabel)) {
          return item;
        }
      }
    }
  }
  
  // Sinon, chercher dans toutes les sources (priorité à ATELIER, puis LABO, puis DEPOT)
  const sourcesOrder: ('ATELIER' | 'LABO' | 'DEPOT')[] = ['ATELIER', 'LABO', 'DEPOT'];
  
  for (const src of sourcesOrder) {
    for (const item of CORRESPONDANCE_TABLE) {
      if (item.source === src) {
        const normalizedTerme = normalizeText(item.termeRetrouve);
        // Recherche exacte ou partielle
        if (normalizedLabel.includes(normalizedTerme) || normalizedTerme.includes(normalizedLabel)) {
          return item;
        }
      }
    }
  }
  
  return null;
}

/**
 * Initialise la table de correspondance (à appeler au démarrage)
 */
export function initCorrespondanceTable(): void {
  // Charger la table intégrée par défaut
  loadEmbeddedTable();
  
  // Essayer de charger depuis le CSV en arrière-plan
  if (typeof window !== 'undefined') {
    loadCorrespondanceTable().catch(err => {
      console.warn('[CORRESPONDANCE] Erreur lors du chargement asynchrone', err);
    });
  }
}

// Initialiser au chargement du module
if (typeof window !== 'undefined') {
  initCorrespondanceTable();
}

