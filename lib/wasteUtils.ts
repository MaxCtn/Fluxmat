import { WASTE_MAP, WasteMapItem } from './wasteMap';
import { findInCorrespondanceTable, initCorrespondanceTable } from './correspondanceTable';

// Initialiser la table de correspondance au chargement du module
if (typeof window !== 'undefined') {
  initCorrespondanceTable();
}

export interface WasteMatch {
  codeCED: string; // Format "170302" (sans espaces)
  label: string;
  categorie: string;
  danger?: boolean; // Nouveau champ : déchet dangereux ou non
}

/**
 * Normalise un texte pour la recherche (minuscules, sans accents, espaces normalisés)
 */
export function normalizeText(text: string): string {
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
 * Détermine si un code déchet est dangereux
 * Un code est dangereux s'il se termine par * ou contient un astérisque
 * Format accepté : "13 02 05*", "130205*", "13-02-05*"
 */
export function isDangerousCode(codeDechet: string | undefined): boolean {
  if (!codeDechet) return false;
  const trimmed = codeDechet.trim();
  // Détecter l'astérisque dans le code (format "13 02 05*" ou "130205*")
  return trimmed.endsWith('*') || trimmed.includes('*');
}

/**
 * Extrait le code déchet sans l'astérisque et détermine le danger
 * Retourne le code normalisé (sans espaces ni astérisque) et l'indicateur de danger
 */
export function parseCodeDechetWithDanger(codeDechet: string): { code: string; danger: boolean } {
  if (!codeDechet) return { code: '', danger: false };
  const trimmed = codeDechet.trim();
  const hasAsterisk = trimmed.endsWith('*') || trimmed.includes('*');
  // Retirer l'astérisque et normaliser (retirer espaces, tirets)
  const code = trimmed.replace(/\*/g, '').replace(/[\s\-]/g, '');
  return { code, danger: hasAsterisk };
}

/**
 * Valide si un code déchet est valide (6 chiffres)
 * Accepte les codes avec ou sans astérisque, avec ou sans espaces
 * Exemples valides : "130508", "130508*", "13 05 08", "13 05 08*"
 */
export function isValidCodeDechet(codeDechet: string | undefined | null): boolean {
  if (!codeDechet) return false;
  // Normaliser le code (enlever astérisque, espaces, tirets) et garder uniquement les chiffres
  const normalized = codeDechet.replace(/\*/g, '').replace(/[\s\-]/g, '').replace(/\D/g, '');
  // Un code déchet valide doit avoir exactement 6 chiffres
  return normalized.length === 6;
}

/**
 * Liste de mots-clés permissifs pour la détection de déchets
 * Fusion des mots-clés de l'ancien système et de ceux extraits de WASTE_MAP
 */
function buildPermissiveKeywords(): Set<string> {
  const keywords = new Set<string>();
  
  // Mots-clés de l'ancien système
  const oldSystemKeywords = [
    'terre', 'deblai', 'enrobe', 'beton', 'gravat', 'inert', 
    'ferraill', 'granulat', 'concasse'
  ];
  oldSystemKeywords.forEach(kw => keywords.add(kw));
  
  // Mots-clés à exclure car trop génériques (créent des faux positifs)
  const excludedKeywords = new Set(['sol']); // "sol" seul est trop générique, on garde "sol pollué" via matchWasteKeywords
  
  // Extraire tous les mots-clés uniques de WASTE_MAP
  for (const item of WASTE_MAP) {
    for (const pattern of item.patterns) {
      // Normaliser le pattern et extraire les mots
      const normalized = normalizeText(pattern);
      const words = normalized.split(/\s+/).filter(w => w.length >= 3); // Ignorer les mots trop courts
      words.forEach(word => {
        // Exclure les mots trop génériques
        if (!excludedKeywords.has(word)) {
          keywords.add(word);
        }
      });
    }
  }
  
  return keywords;
}

// Liste globale des mots-clés permissifs (calculée une seule fois)
const PERMISSIVE_KEYWORDS = buildPermissiveKeywords();

/**
 * Extrait un code CED explicite depuis un texte
 * Format accepté : "17 03 02", "170302", "17-03-02", "_17 01 07"
 * Le code CED est toujours à la fin du libellé ressource
 * Retourne le code sans espaces ni tirets ou null
 * 
 * Validation anti-faux positifs :
 * - Évite de matcher des codes dans des références produit (ex: "600X600 B125")
 * - Le code doit être précédé d'un séparateur clair (espace, tiret, underscore)
 */
export function extractCedCode(text: string): { codeCED: string | null } {
  if (!text) return { codeCED: null };
  
  // Pattern pour codes avec espaces en fin de texte : "17 03 02" ou "_17 01 07"
  // Le code doit être précédé d'un séparateur (espace, tiret, underscore) ou être en début de ligne
  // et doit être suivi de la fin du texte
  const spacedPattern = /(?:^|[\s_\-])(\d{2})\s+(\d{2})\s+(\d{2})\s*$/;
  const spacedMatch = text.match(spacedPattern);
  if (spacedMatch) {
    // Vérifier que ce n'est pas une référence produit (ex: "600X600 B125")
    // Les codes CED commencent toujours par 1x, 2x, 3x, etc. (pas par 6x, 7x, 8x, 9x pour les références)
    const firstPart = spacedMatch[1];
    if (firstPart[0] >= '1' && firstPart[0] <= '2') {
      return { codeCED: `${spacedMatch[1]}${spacedMatch[2]}${spacedMatch[3]}` };
    }
  }
  
  // Pattern pour codes sans espaces en fin de texte : "170302"
  // Le code doit être précédé d'un séparateur ou être en début de ligne
  const compactPattern = /(?:^|[\s_\-])(\d{2})(\d{2})(\d{2})\s*$/;
  const compactMatch = text.match(compactPattern);
  if (compactMatch) {
    const firstPart = compactMatch[1];
    if (firstPart[0] >= '1' && firstPart[0] <= '2') {
      return { codeCED: `${compactMatch[1]}${compactMatch[2]}${compactMatch[3]}` };
    }
  }
  
  // Pattern pour codes avec tirets en fin de texte : "17-03-02"
  const dashedPattern = /(?:^|[\s_])(\d{2})-(\d{2})-(\d{2})\s*$/;
  const dashedMatch = text.match(dashedPattern);
  if (dashedMatch) {
    const firstPart = dashedMatch[1];
    if (firstPart[0] >= '1' && firstPart[0] <= '2') {
      return { codeCED: `${dashedMatch[1]}${dashedMatch[2]}${dashedMatch[3]}` };
    }
  }
  
  return { codeCED: null };
}

/**
 * Cherche un match dans WASTE_MAP basé sur les patterns
 * Priorité : Dangereux > Inerte > Non dangereux
 * Utilise des word boundaries (\b) pour éviter les faux positifs
 * Évite de classifier "terre polluée" comme "terre non polluée"
 */
export function matchWasteKeywords(normalizedText: string, wasteMap: WasteMapItem[] = WASTE_MAP): WasteMatch | null {
  if (!normalizedText) return null;
  
  // Trier WASTE_MAP par priorité : Dangereux > Inerte > Non dangereux
  const sortedMap = [...wasteMap].sort((a, b) => {
    const priority: Record<string, number> = {
      "Déchet dangereux": 1,
      "Déchet inerte": 2,
      "Déchet non dangereux": 3
    };
    return (priority[a.categorie] || 999) - (priority[b.categorie] || 999);
  });
  
  const matches: Array<{ item: WasteMapItem; pattern: string; specificity: number }> = [];
  
  // Parcourir le WASTE_MAP trié
  for (const item of sortedMap) {
    // Vérifier chaque pattern
    for (const pattern of item.patterns) {
      const normalizedPattern = normalizeText(pattern);
      
      // Utiliser des word boundaries pour éviter "bois" dans "boîte"
      // Créer une regex avec \b pour matcher les mots complets
      const patternWords = normalizedPattern.split(/\s+/).filter(w => w.length > 0);
      
      if (patternWords.length === 0) continue;
      
      // Vérifier si tous les mots significatifs du pattern sont présents dans le texte
      // Filtrer d'abord les mots significatifs (longueur >= 3)
      const significantWords = patternWords.filter(w => w.length >= 3);
      
      // Si aucun mot significatif, ignorer ce pattern
      if (significantWords.length === 0) continue;
      
      let allWordsMatch = true;
      let totalMatches = 0;
      
      for (const word of significantWords) {
        // Utiliser word boundary pour éviter les sous-chaînes
        // Échapper les caractères spéciaux regex
        const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const wordRegex = new RegExp(`\\b${escapedWord}\\b`, 'i');
        
        if (wordRegex.test(normalizedText)) {
          totalMatches++;
        } else {
          // Si un mot significatif du pattern n'est pas trouvé, ce n'est pas un match complet
          allWordsMatch = false;
          break; // Sortir dès qu'un mot ne matche pas
        }
      }
      
      // Un match est valide si tous les mots significatifs sont présents
      if (allWordsMatch && totalMatches > 0 && totalMatches === significantWords.length) {
        // Score de spécificité : plus il y a de mots significatifs, plus c'est spécifique
        const specificity = significantWords.length;
        matches.push({ item, pattern: normalizedPattern, specificity });
      }
    }
  }
  
  if (matches.length === 0) return null;
  
  // Trier par spécificité décroissante (le plus spécifique en premier)
  matches.sort((a, b) => b.specificity - a.specificity);
  
  // Détection renforcée de pollution : mots-clés à exclure pour terre non polluée
  const pollutionKeywords = /(pollue|souill|contamin|hap|goudron|hydrocarb)/i;
  const hasPollution = pollutionKeywords.test(normalizedText);
  
  // Cas spécial 1 : si le texte contient des indicateurs de pollution, ne pas retourner "terre non polluée"
  const terreNonPolluee = matches.find(m => m.item.codeCED.replace(/\s/g, '') === '170504');
  
  if (hasPollution && terreNonPolluee && matches.length > 1) {
    // Retirer "terre non polluée" si pollution détectée
    const filtered = matches.filter(m => m.item.codeCED.replace(/\s/g, '') !== '170504');
    if (filtered.length > 0) {
      const bestMatch = filtered[0];
      const codeCED = bestMatch.item.codeCED.replace(/\s/g, '');
      const isDangerous = bestMatch.item.categorie === "Déchet dangereux" || bestMatch.item.codeCED.includes('*');
      return {
        codeCED,
        label: bestMatch.item.label,
        categorie: bestMatch.item.categorie,
        danger: isDangerous
      };
    }
  }
  
  // Cas spécial 2 : pour les enrobés, vérifier si le texte contient des indicateurs de goudron
  // même si le pattern générique "enrobe" a matché (code 17 03 02)
  const enrobeNonDangereux = matches.find(m => m.item.codeCED.replace(/\s/g, '') === '170302');
  const enrobeDangereux = matches.find(m => m.item.codeCED.replace(/\s/g, '') === '170301');
  
  // Si on a matché un enrobé non dangereux mais qu'il y a des indicateurs de goudron dans le texte
  // et qu'aucun pattern dangereux n'a matché, surclasser vers dangereux
  if (enrobeNonDangereux && !enrobeDangereux) {
    const hasGoudronIndicators = /(goudron|hap|pollue|ancien)/i.test(normalizedText);
    if (hasGoudronIndicators) {
      // Chercher l'item dangereux dans WASTE_MAP pour retourner le bon label
      const dangerousEnrobeItem = sortedMap.find(item => item.codeCED.replace(/\s/g, '') === '170301');
      if (dangerousEnrobeItem) {
        // Retourner l'enrobé dangereux au lieu du non dangereux
        const isDangerous = dangerousEnrobeItem.categorie === "Déchet dangereux" || dangerousEnrobeItem.codeCED.includes('*');
        return {
          codeCED: '170301',
          label: dangerousEnrobeItem.label,
          categorie: dangerousEnrobeItem.categorie,
          danger: isDangerous
        };
      }
    }
  }
  
  // Retourner le match le plus spécifique
  const bestMatch = matches[0];
  const codeCED = bestMatch.item.codeCED.replace(/\s/g, '');
  // Déterminer si c'est un déchet dangereux (catégorie "Déchet dangereux" ou code avec astérisque)
  const isDangerous = bestMatch.item.categorie === "Déchet dangereux" || bestMatch.item.codeCED.includes('*');
  return {
    codeCED,
    label: bestMatch.item.label,
    categorie: bestMatch.item.categorie,
    danger: isDangerous
  };
}

/**
 * Fonction principale pour suggérer un code déchet depuis un libellé
 * Priorité : 1. Table de correspondance, 2. Code CED explicite, 3. WASTE_MAP par mots-clés
 */
export function suggestCodeDechet(
  label: string | undefined,
  source?: 'ATELIER' | 'LABO' | 'DEPOT'
): WasteMatch | null {
  if (!label) return null;
  
  // 1. PRIORITÉ : Chercher dans la table de correspondance
  const correspondanceMatch = findInCorrespondanceTable(label, source);
  if (correspondanceMatch) {
    // Convertir le code déchet (format "13 02 05*") en format sans espaces
    const codeCED = correspondanceMatch.codeDechet.replace(/\s/g, '').replace(/\*/g, '');
    
    // Déterminer la catégorie basée sur le danger
    let categorie: string;
    if (correspondanceMatch.danger) {
      categorie = "Déchet dangereux";
    } else {
      // Essayer de déterminer depuis le code CED
      const codeStart = codeCED.slice(0, 2);
      if (codeStart === '17') {
        categorie = "Déchet inerte";
      } else {
        categorie = "Déchet non dangereux";
      }
    }
    
    return {
      codeCED,
      label: correspondanceMatch.formulationCatalogue,
      categorie,
      danger: correspondanceMatch.danger
    };
  }
  
  // 2. Essayer d'extraire un code CED explicite (texte original pour préserver les caractères spéciaux)
  const { codeCED } = extractCedCode(label);
  if (codeCED) {
    // Si on trouve un code explicite, chercher son label dans WASTE_MAP
    const codeWithoutSpaces = codeCED;
    const codeWithSpaces = `${codeCED.slice(0, 2)} ${codeCED.slice(2, 4)} ${codeCED.slice(4, 6)}`;
    
    for (const item of WASTE_MAP) {
      const itemCode = item.codeCED.replace(/\s/g, '');
      if (itemCode === codeWithoutSpaces) {
        const isDangerous = item.categorie === "Déchet dangereux" || item.codeCED.includes('*');
        return {
          codeCED: codeWithoutSpaces,
          label: item.label,
          categorie: item.categorie,
          danger: isDangerous
        };
      }
    }
    
    // Si code trouvé mais pas dans WASTE_MAP, vérifier si le label original contient un astérisque
    const hasAsteriskInLabel = isDangerousCode(label);
    return {
      codeCED: codeWithoutSpaces,
      label: `Code CED ${codeWithSpaces}`,
      categorie: "Non défini",
      danger: hasAsteriskInLabel
    };
  }
  
  // 3. Fallback : chercher par mots-clés dans WASTE_MAP (normaliser pour la recherche)
  const normalized = normalizeText(label);
  return matchWasteKeywords(normalized);
}

/**
 * Vérifie si un texte contient au moins un mot-clé permissif (mode souple)
 * Cherche la présence d'un seul mot-clé sans word boundaries strictes
 * Plus permissif que matchWasteKeywords() qui nécessite tous les mots d'un pattern
 * 
 * Exclusions : évite les faux positifs pour les locations de matériel
 */
function hasPermissiveWasteKeywords(normalizedText: string): boolean {
  if (!normalizedText) return false;
  
  // Exclusion : si le texte commence par "loc" (location), ce n'est probablement pas un déchet
  // mais une location de matériel (ex: "LOC SCIE A SOL")
  if (normalizedText.trim().startsWith('loc ')) {
    return false;
  }
  
  // Chercher la présence d'au moins un mot-clé permissif
  for (const keyword of PERMISSIVE_KEYWORDS) {
    // Recherche simple sans word boundaries strictes (plus permissif)
    // Cela permet de détecter "enrobe" dans "enrobé", "enrobage", etc.
    if (normalizedText.includes(keyword)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Vérifie si un libellé correspond à un déchet (utilisé pour filtrer l'import)
 * Mode STRICT : ne garde que les vrais déchets
 * Ordre de vérification :
 * 1. Exclusions explicites (camions, locations, négoce carrière)
 * 2. Code CED explicite (le plus fiable)
 * 3. Match strict avec WASTE_MAP uniquement
 * 
 * Le mode permissif a été supprimé pour éviter les faux positifs (ex: "D16 BI BENNE 16T")
 */
export function isWaste(label: string | undefined): boolean {
  if (!label) return false;
  
  const normalized = normalizeText(label);
  
  // EXCLUSIONS EXPLICITES : ne pas considérer comme déchets
  
  // 1. Exclusion : "MATERIAUX POUR NEGOCE CARRIERE" n'est pas un déchet
  // C'est plutôt un flux matière (achat/revente) qu'un déchet à éliminer
  if (normalized.includes('negoce carriere') || normalized.includes('négoce carrière') || 
      normalized.includes('materiaux pour negoce') || normalized.includes('matériaux pour négoce')) {
    return false;
  }
  
  // 2. Exclusion : Locations de matériel (ex: "LOC SCIE A SOL")
  if (normalized.trim().startsWith('loc ')) {
    return false;
  }
  
  // 3. Exclusion : Camions/véhicules (ex: "D16 BI BENNE 16T")
  // Patterns de véhicules : codes de camions (D16, D20, etc.), "BI BENNE" (benne de camion)
  // "benne" seul sans contexte déchet = probablement un véhicule
  const vehiclePatterns = [
    /^d\d+\s/, // D16, D20, etc. en début de ligne
    /\bd\d+\s+bi\s+benne/i, // D16 BI BENNE
    /\b(camion|vehicule)\b/i, // camion, véhicule
    /\bbenne\s+\d+t\b/i, // BENNE 16T, BENNE 20T (sans contexte déchet)
    /\bbenne\s+\d+m3\b/i, // BENNE 16M3, etc.
  ];
  
  // Si le texte contient "benne" mais pas de contexte déchet clair, c'est probablement un véhicule
  if (normalized.includes('benne')) {
    // Vérifier si c'est un contexte de déchet (ex: "benne enrobe", "benne dechet")
    const wasteContext = /(benne\s+(enrobe|dechet|beton|terre|gravat|inert|ferraill|bois|dib|carton|papier|verre|vert|municipal|menager|huile|filtre|solvant|emballage|absorbant|epi|amiante|piles|batterie|deee|aerosol))/i;
    if (!wasteContext.test(normalized)) {
      // Pas de contexte déchet clair, probablement un véhicule
      return false;
    }
  }
  
  // Vérifier les autres patterns de véhicules
  for (const pattern of vehiclePatterns) {
    if (pattern.test(normalized)) {
      return false;
    }
  }
  
  // VÉRIFICATIONS POSITIVES : est-ce un déchet ?
  
  // 1. Vérifier si on peut extraire un code CED explicite (le plus fiable)
  // Passer le texte original pour préserver les underscores et caractères spéciaux
  const { codeCED } = extractCedCode(label);
  if (codeCED) return true;
  
  // 2. Vérifier si on peut matcher avec WASTE_MAP (mode strict uniquement)
  // Plus de mode permissif pour éviter les faux positifs
  const match = matchWasteKeywords(normalized);
  if (match !== null) return true;
  
  // Si aucune condition n'est remplie, ce n'est pas un déchet
  return false;
}

