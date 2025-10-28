/* eslint-disable @typescript-eslint/no-explicit-any */
export type Depense = Record<string, any>;
export type RegistreRow = {
  dateExpedition: string; quantite: number; codeUnite: "T";
  denominationUsuelle: string; codeDechet?: string;
  "producteur.raisonSociale": string; "producteur.adresse.libelle": string;
  "destinataire.raisonSociale"?: string;
  __id?: string;
};
export type TransformResult = { registre: RegistreRow[]; controle: (Depense & { suggestionCodeDechet?: string; __id?: string })[]; };

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
function toFrDate(v:any): string { const d=new Date(v); if (isNaN(d.getTime())) return String(v??""); const dd=String(d.getDate()).padStart(2,"0"); const mm=String(d.getMonth()+1).padStart(2,"0"); const yyyy=d.getFullYear(); return `${dd}/${mm}/${yyyy}`; }
function normUnit(u:any): "T" { const s=String(u??"").toUpperCase(); if (/T(ON|ONNE)?/.test(s)||s==="T") return "T"; return "T"; }
function suggestFromKeywords(label: string | undefined): string | undefined {
  if (!label) return; const s=label.normalize("NFD").replace(/\p{Diacritic}/gu,"").toLowerCase();
  if (/enrob/.test(s)) return "170302"; if (/beton/.test(s)) return "170101"; if (/(terre|deblai)/.test(s)) return "170504";
  if (/(gravat|inert)/.test(s)) return "170107"; if (/ferraill/.test(s)) return "170405"; return undefined;
}

// Filtres selon v_depenses_filtrees
function passesFilter(row: any): boolean {
  const origine = get(row, ["Origine", "origine"]);
  if (origine === 'Pointage personnel') return false;

  const chapitre = get(row, ["Libellé Chapitre Comptable", "Libelle Chapitre Comptable"]);
  if (!chapitre) return false;
  const chapitresValides = ['MATERIAUX & CONSOMMABLES', 'MATERIEL', 'S/T & PRESTATAIRES', 'S/T PRODUITS NON SOUMIS A FGX'];
  if (!chapitresValides.includes(chapitre)) return false;

  const sousChapitre = get(row, ["Libellé Sous-chapitre Comptable", "Libelle Sous-chapitre Comptable"]) || '';
  const sousChapitresExclus = ['ACIERS', 'CONSOMMABLES', 'FRAIS ANNEXES MATERIEL'];
  if (sousChapitresExclus.includes(sousChapitre)) return false;

  const rubrique = get(row, ["Libellé Rubrique Comptable", "Libelle Rubrique Comptable"]);
  if (!rubrique) return false;
  const rubriquesValides = [
    'Agregats', 'AMENAGT ESPACES VERT', 'Autres prestations', 'Balisage', 'Enrobes a froid', 'Fraisat',
    'Loc camions', 'Loc int. camions', 'Loc int. mat transport', 'Loc materiel de transport', 'Loc materiel divers',
    'Materiaux divers', 'Materiaux recycles', 'Mise decharge materiaux divers', 'Prestation environnement',
    'Produits de voirie', 'SABLE', 'Sous traitance tiers', 'STPD tiers', 'Traitement dechets inertes'
  ];
  if (!rubriquesValides.includes(rubrique)) return false;

  return true;
}

let rowId=0;
export function transform(rows: Depense[]): TransformResult {
  const registre: RegistreRow[]=[]; const controle: (Depense & { suggestionCodeDechet?: string; __id?: string })[]=[];

  for (const row of rows) {
    // Filtrer selon v_depenses_filtrees
    if (!passesFilter(row)) continue;

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
      quantite, codeUnite: normUnit(unite),
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
      const raw: any = { ...row, suggestionCodeDechet: suggestion, __id: `c${rowId++}` };
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
