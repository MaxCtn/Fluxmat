/* eslint-disable @typescript-eslint/no-explicit-any */
export type Depense = Record<string, any>;

// Type pour les données complètes
export type DepenseComplete = {
  // BU (Business Unit)
  code_entite?: string;
  libelle_entite?: string;
  
  // Chantier
  code_project?: string;
  code_chantier?: string;
  libelle_chantier?: string;
  
  // Matériaux/Déchets
  ressource?: string;
  libelle_ressource?: string;
  unite?: string;
  quantite?: number;
  code_dechet?: string;
  
  // Exutoire
  code_fournisseur?: string;
  libelle_fournisseur?: string;
  
  // Traçabilité financière
  date_expedition?: string;
  num_commande?: string;
  num_reception?: string;
  code_facture?: string;
  code_ecriture?: string;
  statut?: string;
  pu?: number;
  montant?: number;
  
  // Contexte technique
  code_ouvrage_origine?: string;
  libelle_ouvrage_origine?: string;
  code_ouvrage_actuel?: string;
  libelle_ouvrage_actuel?: string;
  
  // Compléments
  code_complement_origine?: string;
  libelle_complement_origine?: string;
  code_complement_actuel?: string;
  libelle_complement_actuel?: string;
  auteur_ouvrage_modifie?: string;
  
  // Comptabilité/Gestion
  code_rubrique_comptable?: string;
  libelle_rubrique_comptable?: string;
  code_chapitre_comptable?: string;
  libelle_chapitre_comptable?: string;
  code_sous_chapitre_comptable?: string;
  libelle_sous_chapitre_comptable?: string;
  nature_depense_comptable?: string;
  libelle_nature_comptable?: string;
  
  code_rubrique_gestion?: string;
  libelle_rubrique_gestion?: string;
  code_chapitre_gestion?: string;
  libelle_chapitre_gestion?: string;
  code_sous_chapitre_gestion?: string;
  libelle_sous_chapitre_gestion?: string;
  nature_depense_gestion?: string;
  libelle_nature_gestion?: string;
  
  // Audit
  origine?: string;
  auteur_depense?: string;
  modifie?: string;
  auteur_commentaire?: string;
  commentaire?: string;
  valide?: string;
  auteur_valide?: string;
  code_utilisateur_recalage?: string;
  date_traitement_recalage?: string;
  statut_rapprochement_facture?: string;
  date_chargement?: string;
  
  // Métadonnées
  is_materiau?: boolean;
  is_exutoire_valide?: boolean;
  __id?: string;
};

// Type pour le résultat de transformation
export type TransformCompleteResult = { 
  toutes_donnees: DepenseComplete[]; 
  materiaux: DepenseComplete[]; 
  controle: DepenseComplete[]; 
};

// Types existants pour compatibilité
export type RegistreRow = {
  dateExpedition: string; quantite: number; codeUnite: "T";
  denominationUsuelle: string; codeDechet?: string;
  "producteur.raisonSociale": string; "producteur.adresse.libelle": string;
  "destinataire.raisonSociale"?: string;
  __id?: string;
};
export type TransformResult = { registre: RegistreRow[]; controle: (Depense & { suggestionCodeDechet?: string; __id?: string })[]; };

const CODE_DECHET_REGEX = /(?:^|[\s_\-\.])(?:\d{2}\s?\.?\s?\d{2}\s?\.?\s?\d{2})(?=$|[\s_\-\.])/g;

function normalizeKey(s: string): string {
  return (s || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function buildKeyIndex(obj: Record<string, any>) { 
  const idx: Record<string,string>={}; 
  for (const k of Object.keys(obj)) idx[normalizeKey(k)]=k; 
  return idx; 
}

function get(obj: Record<string, any>, keys: string[]): any { 
  const idx=buildKeyIndex(obj); 
  for (const k of keys){ 
    const nk=normalizeKey(k); 
    if (idx[nk]!==undefined) return obj[idx[nk]]; 
  } 
  return undefined; 
}

export function extractCed(label: string | undefined): string | undefined {
  if (!label) return;
  const matches = [...(label.match(CODE_DECHET_REGEX) ?? [])].map(s=> s.replace(/[^\d]/g,"")).filter(s=> s.length===6);
  return matches.length ? matches[matches.length-1] : undefined;
}

export function isMateriauLike(label: string | undefined): boolean {
  if (!label) return false;
  const s = label.normalize("NFD").replace(/\p{Diacritic}/gu,"").toLowerCase();
  if (extractCed(label)) return true;
  return /(terre|deblai|enrobe|beton|gravat|inert|ferraill|granulat|concasse)/.test(s);
}

function toFrDate(v:any): string { 
  const d=new Date(v); 
  if (isNaN(d.getTime())) return String(v??""); 
  const dd=String(d.getDate()).padStart(2,"0"); 
  const mm=String(d.getMonth()+1).padStart(2,"0"); 
  const yyyy=d.getFullYear(); 
  return `${dd}/${mm}/${yyyy}`; 
}

function normUnit(u:any): string { 
  const s=String(u??"").toUpperCase(); 
  if (/T(ON|ONNE)?/.test(s)||s==="T") return "T"; 
  if (/M[³3]/.test(s)) return "m³";
  if (/L(ITRE)?/.test(s)) return "L";
  return s || "T"; 
}

function suggestFromKeywords(label: string | undefined): string | undefined {
  if (!label) return; 
  const s=label.normalize("NFD").replace(/\p{Diacritic}/gu,"").toLowerCase();
  if (/enrob/.test(s)) return "170302"; 
  if (/beton/.test(s)) return "170101"; 
  if (/(terre|deblai)/.test(s)) return "170504";
  if (/(gravat|inert)/.test(s)) return "170107"; 
  if (/ferraill/.test(s)) return "170405"; 
  return undefined;
}

let rowId=0;

// Nouvelle fonction de transformation complète
export function transformComplete(rows: Depense[]): TransformCompleteResult {
  const toutes_donnees: DepenseComplete[] = [];
  const materiaux: DepenseComplete[] = [];
  const controle: DepenseComplete[] = [];

  for (const row of rows) {
    // Fonction helper pour nettoyer les valeurs
    const cleanValue = (value: any) => {
      if (value === undefined || value === null) return null;
      if (typeof value === 'string' && value.trim() === '') return null;
      return value;
    };

    // Extraire toutes les données
    const depenseComplete: DepenseComplete = {
      // BU
      code_entite: cleanValue(get(row, ["Code Entité", "Code Entite"])),
      libelle_entite: cleanValue(get(row, ["Libellé Entité", "Libelle Entite"])),
      
      // Chantier
      code_project: cleanValue(get(row, ["Code Project"])),
      code_chantier: cleanValue(get(row, ["Code Chantier"])),
      libelle_chantier: cleanValue(get(row, ["Libellé Chantier", "Libelle Chantier"])),
      
      // Matériaux/Déchets
      ressource: cleanValue(get(row, ["Ressource"])),
      libelle_ressource: cleanValue(get(row, ["Libellé Ressource", "Libelle Ressource"])),
      unite: normUnit(get(row, ["Unité", "Unite"])),
      quantite: Number(get(row, ["Quantité", "Quantite"]) || 0),
      
      // Exutoire
      code_fournisseur: cleanValue(get(row, ["Code Fournisseur"])),
      libelle_fournisseur: cleanValue(get(row, ["Libellé Fournisseur", "Libelle Fournisseur"])),
      
      // Traçabilité financière
      date_expedition: cleanValue(toFrDate(get(row, ["Date"]))),
      num_commande: cleanValue(get(row, ["Num Commande"])),
      num_reception: cleanValue(get(row, ["Num Réception", "Num Reception"])),
      code_facture: cleanValue(get(row, ["Code Facture"])),
      code_ecriture: cleanValue(get(row, ["Code Ecriture"])),
      statut: cleanValue(get(row, ["Statut"])),
      pu: Number(get(row, ["PU"]) || 0),
      montant: Number(get(row, ["Montant"]) || 0),
      
      // Contexte technique
      code_ouvrage_origine: cleanValue(get(row, ["Code Ouvrage d'origine"])),
      libelle_ouvrage_origine: cleanValue(get(row, ["Libellé Ouvrage d'origine"])),
      code_ouvrage_actuel: cleanValue(get(row, ["Code Ouvrage actuel/modifié"])),
      libelle_ouvrage_actuel: cleanValue(get(row, ["Libellé Ouvrage actuel/modifié"])),
      
      // Compléments (colonnes qui n'existent pas dans Supabase - ignorées)
      // code_complement_origine: cleanValue(get(row, ["Code complément d'origine"])),
      // libelle_complement_origine: cleanValue(get(row, ["Libellé complément d'origine"])),
      // code_complement_actuel: cleanValue(get(row, ["Code complément actuel/modifié"])),
      // libelle_complement_actuel: cleanValue(get(row, ["Libellé complément actuel/modifié"])),
      // auteur_ouvrage_modifie: cleanValue(get(row, ["Auteur ouvrage modifié"])),
      
      // Comptabilité/Gestion (seulement les colonnes qui existent)
      code_rubrique_comptable: cleanValue(get(row, ["Code Rubrique Comptable"])),
      libelle_rubrique_comptable: cleanValue(get(row, ["Libellé Rubrique Comptable"])),
      // code_chapitre_comptable: cleanValue(get(row, ["Code Chapitre Comptable"])), // N'existe pas
      // libelle_chapitre_comptable: cleanValue(get(row, ["Libellé Chapitre Comptable"])), // N'existe pas
      // code_sous_chapitre_comptable: cleanValue(get(row, ["Code Sous-chapitre Comptable"])), // N'existe pas
      // libelle_sous_chapitre_comptable: cleanValue(get(row, ["Libellé Sous-chapitre Comptable"])), // N'existe pas
      nature_depense_comptable: cleanValue(get(row, ["Nature Depense Comptable"])),
      // libelle_nature_comptable: cleanValue(get(row, ["Libellé Nature Comptable"])), // N'existe pas
      
      code_rubrique_gestion: cleanValue(get(row, ["Code Rubrique Gestion"])),
      libelle_rubrique_gestion: cleanValue(get(row, ["Libellé Rubrique Gestion"])),
      // code_chapitre_gestion: cleanValue(get(row, ["Code Chapitre Gestion"])), // N'existe pas
      // libelle_chapitre_gestion: cleanValue(get(row, ["Libellé Chapitre Gestion"])), // N'existe pas
      // code_sous_chapitre_gestion: cleanValue(get(row, ["Code Sous-chapitre Gestion"])), // N'existe pas
      // libelle_sous_chapitre_gestion: cleanValue(get(row, ["Libellé Sous-chapitre Gestion"])), // N'existe pas
      nature_depense_gestion: cleanValue(get(row, ["Nature Depense Gestion"])),
      // libelle_nature_gestion: cleanValue(get(row, ["Libellé Nature Gestion"])), // N'existe pas
      
      // Audit (seulement les colonnes qui existent)
      origine: cleanValue(get(row, ["Origine"])),
      auteur_depense: cleanValue(get(row, ["Auteur Depense"])),
      modifie: cleanValue(get(row, ["Modifié", "Modifie"])),
      auteur_commentaire: cleanValue(get(row, ["Auteur Commentaire"])),
      commentaire: cleanValue(get(row, ["Commentaire"])),
      valide: cleanValue(get(row, ["Valide"])),
      auteur_valide: cleanValue(get(row, ["Auteur Valide"])),
      // code_utilisateur_recalage: cleanValue(get(row, ["Code Utilisateur Recalage"])), // N'existe pas
      // date_traitement_recalage: cleanValue(get(row, ["Date Traitement Recalage"])), // N'existe pas
      // statut_rapprochement_facture: cleanValue(get(row, ["Statut rapprochement facture"])), // N'existe pas
      // date_chargement: cleanValue(get(row, ["Date Chargement"])), // N'existe pas
      
      __id: `d${rowId++}`
    };

    // Détecter si c'est un matériau
    const isMateriau = isMateriauLike(depenseComplete.libelle_ressource);
    depenseComplete.is_materiau = isMateriau;
    
    // Extraire le code déchet si présent
    const ced = extractCed(depenseComplete.libelle_ressource);
    if (ced) {
      depenseComplete.code_dechet = ced;
    }

    // Ajouter à toutes les données
    toutes_donnees.push(depenseComplete);

    // Si c'est un matériau, l'ajouter aux matériaux
    if (isMateriau) {
      if (ced) {
        materiaux.push(depenseComplete);
      } else {
        // Matériau sans code déchet -> contrôle
        const suggestion = suggestFromKeywords(depenseComplete.libelle_ressource);
        depenseComplete.code_dechet = suggestion || "";
        controle.push(depenseComplete);
      }
    }
  }

  return { toutes_donnees, materiaux, controle };
}

// Fonction existante pour compatibilité
export function transform(rows: Depense[]): TransformResult {
  const registre: RegistreRow[]=[]; 
  const controle: (Depense & { suggestionCodeDechet?: string; __id?: string })[]=[];

  for (const row of rows) {
    const label = get(row, ["Libellé Ressource","Libelle Ressource","Libellé Article","Libelle Article"]) ?? "";
    if (!isMateriauLike(label)) continue;
    const date = get(row, ["Date"]) ?? "";
    const unite = get(row, ["Unité","Unite"]);
    const quantite = Number(get(row, ["Quantité","Quantite"]) ?? 0);
    const entite = get(row, ["Libellé Entité","Libelle Entite"]) ?? "";
    const chantier = get(row, ["Libellé Chantier","Libelle Chantier"]) ?? "";
    const fournisseur = get(row, ["Libellé Fournisseur","Libelle Fournisseur","Fournisseur"]) ?? "";

    const ced = extractCed(label);
    const base: RegistreRow = {
      dateExpedition: toFrDate(date),
      quantite, codeUnite: normUnit(unite) as "T",
      denominationUsuelle: String(label).replace(/\s+/g," ").trim(),
      codeDechet: ced,
      "producteur.raisonSociale": entite,
      "producteur.adresse.libelle": chantier,
      "destinataire.raisonSociale": fournisseur || undefined,
      __id: `r${rowId++}`
    };

    if (ced) { registre.push(base); }
    else {
      const suggestion = suggestFromKeywords(label);
      const raw = { ...row, suggestionCodeDechet: suggestion, __id: `c${rowId++}` };
      raw["dateExpedition"]=base.dateExpedition; raw["denominationUsuelle"]=base.denominationUsuelle;
      raw["quantite"]=base.quantite; raw["codeUnite"]=base.codeUnite;
      raw["producteur.raisonSociale"]=base["producteur.raisonSociale"];
      raw["producteur.adresse.libelle"]=base["producteur.adresse.libelle"];
      raw["destinataire.raisonSociale"]=base["destinataire.raisonSociale"];
      raw["codeDechet"]=""; controle.push(raw);
    }
  }
  return { registre, controle };
}
