/* eslint-disable @typescript-eslint/no-explicit-any */
import { isWaste, extractCedCode, suggestCodeDechet, isDangerousCode, parseCodeDechetWithDanger } from './wasteUtils';

export type Depense = Record<string, any>;
export type RegistreRow = {
  dateExpedition: string; quantite: number; codeUnite: "T";
  denominationUsuelle: string; codeDechet?: string;
  danger?: boolean; // Déchet dangereux ou non
  etablissement?: string; // Code Entité → Etablissement
  agence?: string; // Libellé Entité → Agence
  chantier?: string; // Libellé Chantier → chantier
  exutoire?: string; // Libellé Fournisseur → exutoire
  // Anciens champs conservés pour compatibilité
  "producteur.raisonSociale": string; "producteur.adresse.libelle": string;
  "destinataire.raisonSociale"?: string;
  __id?: string;
};
export type TransformResult = { 
  registre: RegistreRow[]; 
  controle: (Depense & { suggestionCodeDechet?: string; __id?: string })[];
  allWasteRows: RegistreRow[]; // Tableau unifié avec toutes les lignes déchets (avec ou sans code), trié initialement
};

const CODE_DECHET_REGEX = /[\s_]*(\d{2})\s*(\d{2})\s*(\d{2})\s*$/;
function normalizeKey(s: string): string {
  return (s || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function buildKeyIndex(obj: Record<string, any>) { const idx: Record<string,string>={}; for (const k of Object.keys(obj)) idx[normalizeKey(k)]=k; return idx; }
function get(obj: Record<string, any>, keys: string[]): any { const idx=buildKeyIndex(obj); for (const k of keys){ const nk=normalizeKey(k); if (idx[nk]!==undefined) return obj[idx[nk]]; } return undefined; }

export function extractCed(label: string | undefined): string | undefined {
  if (!label) return;
  const match = label.match(CODE_DECHET_REGEX);
  if (!match) return undefined;
  const code = `${match[1]}${match[2]}${match[3]}`;
  return code.length === 6 ? code : undefined;
}
export function isMateriauLike(label: string | undefined): boolean {
  if (!label) return false;
  const s = label.normalize("NFD").replace(/\p{Diacritic}/gu,"").toLowerCase();
  if (extractCed(label)) return true;
  return /(terre|deblai|enrobe|beton|gravat|inert|ferraill|granulat|concasse)/.test(s);
}
/**
 * Convertit une date dans différents formats vers DD/MM/YYYY
 * Gère : dates Excel (nombres), DD/MM/YYYY, YYYY-MM-DD, dates JavaScript
 * Utilise UTC pour éviter les décalages d'un jour dus au fuseau horaire
 */
function toFrDate(v: any): string {
  if (!v) return "";
  
  const vStr = String(v).trim();
  if (!vStr) return "";
  
  // Si c'est au format DD/MM/YYYY avec ou sans heure → ne garder que la date
  const frDateMatch = vStr.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?(?:\s+[AP]M)?$/i);
  if (frDateMatch) {
    return `${frDateMatch[1]}/${frDateMatch[2]}/${frDateMatch[3]}`;
  }
  
  // Si c'est au format YYYY-MM-DD (avec ou sans temps), le convertir
  const isoMatch = vStr.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+\-]\d{2}:\d{2})?)?$/);
  if (isoMatch) {
    return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
  }
  
  // Si c'est un nombre (date Excel sérialisée)
  if (typeof v === 'number' || /^\d+\.?\d*$/.test(vStr)) {
    const excelDate = Number(v);
    if (excelDate > 0 && excelDate < 100000) {
      // Dates Excel : nombre de jours depuis le 30 décembre 1899
      // Excel compte le 1er janvier 1900 comme jour 1 (bug Excel : c'est en fait jour 2)
      // Utiliser UTC pour éviter les décalages dus au fuseau horaire
      // Note: excelEpoch (1899-12-30) corrige déjà le bug Excel, donc pas besoin de -1
      const excelEpoch = Date.UTC(1899, 11, 30); // 30 décembre 1899 en UTC
      const dateMs = excelEpoch + excelDate * 24 * 60 * 60 * 1000;
      const date = new Date(dateMs);
      
      if (!isNaN(date.getTime())) {
        // Utiliser UTC pour éviter les décalages
        const dd = String(date.getUTCDate()).padStart(2, "0");
        const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
        const yyyy = date.getUTCFullYear();
        return `${dd}/${mm}/${yyyy}`;
      }
    }
  }
  
  // Essayer de parser avec Date JavaScript native
  // Si c'est une date avec heure, extraire uniquement la partie date en UTC
  const d = new Date(v);
  if (!isNaN(d.getTime())) {
    // Utiliser UTC pour éviter les décalages dus au fuseau horaire
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const yyyy = d.getUTCFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
  
  // Si aucune conversion n'a fonctionné, retourner la valeur originale
  return vStr;
}
function normUnit(u:any): "T" { const s=String(u??"").toUpperCase(); if (/T(ON|ONNE)?/.test(s)||s==="T") return "T"; return "T"; }
function suggestFromKeywords(label: string | undefined): string | undefined {
  if (!label) return; const s=label.normalize("NFD").replace(/\p{Diacritic}/gu,"").toLowerCase();
  if (/enrob/.test(s)) return "170302"; if (/beton/.test(s)) return "170101"; if (/(terre|deblai)/.test(s)) return "170504";
  if (/(gravat|inert)/.test(s)) return "170107"; if (/ferraill/.test(s)) return "170405"; return undefined;
}

/**
 * Helpers pour mapper les colonnes selon la nouvelle nomenclature
 */
function getEtablissement(row: any): string {
  return get(row, ["Code Entité", "Code Entite", "code_entite", "Code Entité", "etablissement"]) || "";
}

function getAgence(row: any): string {
  return get(row, ["Libellé Entité", "Libelle Entite", "libelle_entite", "Libellé Entité", "agence"]) || "";
}

function getChantier(row: any): string {
  return get(row, ["Libellé Chantier", "Libelle Chantier", "libelle_chantier", "Libellé Chantier", "chantier"]) || "";
}

function getExutoire(row: any): string {
  return get(row, ["Libellé Fournisseur", "Libelle Fournisseur", "libelle_fournisseur", "Fournisseur", "exutoire"]) || "";
}

// Filtres selon v_depenses_filtrees (règles Power Query exactes)
function passesFilter(row: any): boolean {
  // 1. ORIGINE - Chercher avec plusieurs variations
  const origine = get(row, [
    "Origine", 
    "origine",
    "Libellé Origine",
    "Libelle Origine"
  ]);
  
  if (origine && String(origine).trim() === 'Pointage personnel') {
    return false;
  }

  // 2. CHAPITRE COMPTABLE - Chercher avec plusieurs variations
  const chapitre = get(row, [
    "Libellé Chapitre Comptable", 
    "Libelle Chapitre Comptable",
    "Chapitre Comptable",
    "chapitre comptable",
    "Libellé Chapitre",
    "Libelle Chapitre"
  ]);
  
  if (!chapitre) {
    return false;
  }
  
  const chapitreStr = String(chapitre).trim();
  const chapitresValides = [
    'MATERIAUX & CONSOMMABLES', 
    'MATERIEL', 
    'S/T & PRESTATAIRES', 
    'S/T PRODUITS NON SOUMIS A FGX'
  ];
  
  if (!chapitresValides.includes(chapitreStr)) {
    return false;
  }

  // 3. SOUS-CHAPITRE COMPTABLE - Chercher avec plusieurs variations
  const sousChapitre = get(row, [
    "Libellé Sous-chapitre Comptable", 
    "Libelle Sous-chapitre Comptable",
    "Sous-chapitre Comptable",
    "sous-chapitre comptable",
    "Libellé Sous-chapitre",
    "Libelle Sous-chapitre"
  ]) || '';
  
  const sousChapitreStr = String(sousChapitre).trim();
  const sousChapitresExclus = ['ACIERS', 'CONSOMMABLES', 'FRAIS ANNEXES MATERIEL'];
  
  if (sousChapitreStr && sousChapitresExclus.includes(sousChapitreStr)) {
    return false;
  }

  // 4. RUBRIQUE COMPTABLE - Chercher avec plusieurs variations
  const rubrique = get(row, [
    "Libellé Rubrique Comptable", 
    "Libelle Rubrique Comptable",
    "Rubrique Comptable",
    "rubrique comptable",
    "Libellé Rubrique",
    "Libelle Rubrique"
  ]);
  
  if (!rubrique) {
    return false;
  }
  
  const rubriqueStr = String(rubrique).trim();
  const rubriquesValides = [
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
  
  if (!rubriquesValides.includes(rubriqueStr)) {
    return false;
  }

  return true;
}

let rowId=0;
export function transform(rows: Depense[]): TransformResult & { allRows?: Depense[] } {
  const registre: RegistreRow[]=[]; 
  const controle: (Depense & { suggestionCodeDechet?: string; __id?: string })[]=[];

  console.log(`[TRANSFORM] Début transformation de ${rows.length} lignes`);

  for (const row of rows) {
    // Extraire le libellé ressource d'abord
    const rawLabel = get(row, ["Libellé Ressource","Libelle Ressource","Libellé Article","Libelle Article"]);
    const label = rawLabel ?? "";
    
    // 1. FILTRE PRINCIPAL : Est-ce que le libellé décrit un déchet physique ?
    if (!isWaste(label)) {
      continue; // Ce n'est pas un déchet, on ignore
    }
    
    // 2. FILTRE SECONDAIRE : Est-ce qu'on garde ce déchet dans notre périmètre comptable ?
    // On applique passesFilter() APRÈS isWaste() pour ne pas perdre des déchets valides
    // juste parce que la rubrique comptable n'est pas dans la whitelist
    if (!passesFilter(row)) {
      continue;
    }
    const date = get(row, ["Date"]) ?? "";
    const unite = get(row, ["Unité","Unite"]);
    const quantite = Number(get(row, ["Quantité","Quantite"]) ?? 0);
    
    // Nouveau mapping des colonnes
    const etablissement = getEtablissement(row); // Code Entité → Etablissement
    const agence = getAgence(row); // Libellé Entité → Agence
    const chantier = getChantier(row); // Libellé Chantier → chantier
    const exutoire = getExutoire(row); // Libellé Fournisseur → exutoire
    
    // Anciennes valeurs pour compatibilité
    const entite = agence; // Libellé Entité
    const fournisseur = exutoire; // Libellé Fournisseur

    // Extraire le code CED explicite depuis le libellé
    // D'abord, vérifier si le label contient un astérisque (indicateur de danger)
    const labelHasAsterisk = isDangerousCode(label);
    
    const { codeCED: ced } = extractCedCode(label);
    // Convertir null en undefined pour compatibilité TypeScript
    const codeDechet = ced || undefined;
    const hasExplicitCode = Boolean(codeDechet);
    
    // Suggérer un code déchet depuis les mots-clés si pas de code explicite
    let suggestionCodeDechet: string | undefined;
    let dangerValue: boolean | undefined = undefined;
    if (!codeDechet) {
      // Déterminer la source depuis les données (peut être dans une colonne spécifique)
      // Pour l'instant, on ne passe pas de source, mais on pourrait l'extraire depuis row
      const suggestion = suggestCodeDechet(label);
      suggestionCodeDechet = suggestion?.codeCED || undefined;
      // Priorité : astérisque dans le label > suggestion de la table
      dangerValue = labelHasAsterisk || suggestion?.danger;
    } else {
      // Si on a un code explicite, vérifier d'abord l'astérisque dans le label
      // Puis chercher aussi le danger depuis la table de correspondance
      const suggestion = suggestCodeDechet(label);
      // Priorité : astérisque dans le label > suggestion de la table
      dangerValue = labelHasAsterisk || suggestion?.danger;
    }
    
    const base: RegistreRow = {
      dateExpedition: toFrDate(date),
      quantite, 
      codeUnite: normUnit(unite),
      denominationUsuelle: typeof rawLabel === "string" ? rawLabel : String(label || "").replace(/\s+/g," ").trim(),
      codeDechet, // Code déchet si trouvé, sinon undefined
      danger: hasExplicitCode ? dangerValue : undefined, // Ne marquer dangereux que si code explicite
      // Nouveaux champs avec mapping
      etablissement: etablissement || undefined,
      agence: agence || undefined,
      chantier: chantier || undefined,
      exutoire: exutoire || undefined,
      // Anciens champs conservés pour compatibilité
      "producteur.raisonSociale": entite,
      "producteur.adresse.libelle": chantier,
      "destinataire.raisonSociale": fournisseur || undefined,
      __id: `r${rowId++}`
    };

    // Séparer les déchets selon qu'ils ont un code CED explicite ou non
    if (hasExplicitCode && codeDechet?.length === 6) {
      // Déchet avec code CED explicite → va dans registre (prêt à l'export)
      registre.push(base);
    } else {
      // Déchet sans code CED explicite → va dans contrôle (à valider/compléter)
      const raw: any = { ...row, suggestionCodeDechet, __id: `c${rowId++}` };
      raw["dateExpedition"]=base.dateExpedition; 
      raw["denominationUsuelle"]=base.denominationUsuelle;
      raw["quantite"]=base.quantite; 
      raw["codeUnite"]=base.codeUnite;
      raw["danger"]=dangerValue; // Ajouter le champ danger pour suggestion
      // Nouveaux champs avec mapping
      raw["etablissement"]=base.etablissement;
      raw["agence"]=base.agence;
      raw["chantier"]=base.chantier;
      raw["exutoire"]=base.exutoire;
      // Anciens champs conservés pour compatibilité
      raw["producteur.raisonSociale"]=base["producteur.raisonSociale"];
      raw["producteur.adresse.libelle"]=base["producteur.adresse.libelle"];
      raw["destinataire.raisonSociale"]=base["destinataire.raisonSociale"];
      raw["codeDechet"]=""; // Pas de code déchet lors de l'import
      controle.push(raw);
    }
  }
  
  // Créer le tableau unifié avec toutes les lignes (avec et sans code)
  // Convertir les lignes de controle en RegistreRow pour avoir un format uniforme
  const controleAsRegistre: RegistreRow[] = controle.map(raw => ({
    dateExpedition: raw.dateExpedition || "",
    quantite: raw.quantite || 0,
    codeUnite: raw.codeUnite || "T",
    denominationUsuelle: raw.denominationUsuelle || "",
    codeDechet: undefined, // Pas de code déchet pour les lignes sans code
    danger: undefined, // Pas de danger sans code explicite
    etablissement: raw.etablissement,
    agence: raw.agence,
    chantier: raw.chantier,
    exutoire: raw.exutoire,
    "producteur.raisonSociale": raw["producteur.raisonSociale"] || "",
    "producteur.adresse.libelle": raw["producteur.adresse.libelle"] || "",
    "destinataire.raisonSociale": raw["destinataire.raisonSociale"],
    __id: raw.__id || `c${rowId++}`
  }));
  
  // Fusionner et trier : lignes avec code en premier
  const allWasteRows: RegistreRow[] = [...registre, ...controleAsRegistre].sort((a, b) => {
    // Lignes avec codeDechet en premier
    const aHasCode = Boolean(a.codeDechet);
    const bHasCode = Boolean(b.codeDechet);
    if (aHasCode && !bHasCode) return -1;
    if (!aHasCode && bHasCode) return 1;
    // Sinon garder l'ordre d'origine (peut être re-trié par l'UI)
    return 0;
  });
  
  console.log(`[TRANSFORM] Transformation terminée: ${registre.length} lignes avec code déchet (registre), ${controle.length} lignes sans code (contrôle), ${allWasteRows.length} lignes totales unifiées`);
  return { registre, controle, allWasteRows, allRows: rows };
}
