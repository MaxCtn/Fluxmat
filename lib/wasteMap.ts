/**
 * Mapping des mots-clés détectables vers les informations de déchet normalisées
 */

export interface WasteMapItem {
  patterns: string[];
  label: string;
  codeCED: string; // Format "17 03 02"
  categorie: "Déchet inerte" | "Déchet non dangereux" | "Déchet dangereux";
}

export const WASTE_MAP: WasteMapItem[] = [
  {
    patterns: [
      "terre et cailloux non pollu", // terre / cailloux propres
      "terre non pollu",
      "cailloux non pollu"
    ],
    label: "Terre et cailloux non pollués",
    codeCED: "17 05 04",
    categorie: "Déchet inerte"
  },
  {
    patterns: [
      "melange bitumineux ne contenant pas de goudron",
      "mélanges bitumineux ne contenant pas de goudron",
      "enrobe a froid", // souvent utilisé pour l'enrobé propre
      "enrobé à froid"
    ],
    label: "Mélanges bitumineux ne contenant pas de goudron",
    codeCED: "17 03 02",
    categorie: "Déchet inerte"
  },
  {
    patterns: ["béton", "beton"],
    label: "Béton",
    codeCED: "17 01 01",
    categorie: "Déchet inerte"
  },
  {
    patterns: ["ferraille", "acier", "métaux ferreux"],
    label: "Ferraille",
    codeCED: "17 04 07",
    categorie: "Déchet non dangereux"
  },
  {
    patterns: ["bois"],
    label: "Bois",
    codeCED: "17 02 01",
    categorie: "Déchet non dangereux"
  },
  {
    patterns: ["pvc", "pe ", "polyethyl", "plastique"],
    label: "PVC / PE / Plastique",
    codeCED: "17 02 03",
    categorie: "Déchet non dangereux"
  },
  {
    patterns: ["dib", "dechet industriel banal", "déchets industriels banals"],
    label: "DIB",
    codeCED: "17 09 04",
    categorie: "Déchet non dangereux"
  },
  {
    patterns: ["carton", "papier", "carton/papier"],
    label: "Carton / Papier",
    codeCED: "20 01 01",
    categorie: "Déchet non dangereux"
  },
  {
    patterns: ["verre", "vitrage"],
    label: "Verre",
    codeCED: "15 01 07",
    categorie: "Déchet non dangereux"
  },
  {
    patterns: ["déchets verts", "dechets verts", "branchage", "elagage", "tonte"],
    label: "Déchets verts",
    codeCED: "20 02 01",
    categorie: "Déchet non dangereux"
  },
  {
    patterns: [
      "déchets municipaux en mélange",
      "dechets menagers melange",
      "tout-venant menager"
    ],
    label: "Déchets municipaux en mélange",
    codeCED: "20 03 01",
    categorie: "Déchet non dangereux"
  },
  // DANGEREUX
  {
    patterns: [
      "huile noire",
      "huile de vidange",
      "huile noire usagée",
      "huile moteur",
      "huile boite de vitesse"
    ],
    label: "Huile moteur / boîte de vitesse usagée",
    codeCED: "13 02 05*",
    categorie: "Déchet dangereux"
  },
  {
    patterns: [
      "separateur hydrocarbure",
      "séparateur hydrocarbure",
      "eau+boue hydrocarb",
      "boue hydrocarb",
      "mélange eau et boue des séparateurs"
    ],
    label: "Mélange eau et boue des séparateurs à hydrocarbures",
    codeCED: "13 05 08*",
    categorie: "Déchet dangereux"
  },
  {
    patterns: [
      "produit fontaine a solvant",
      "fontaine dégraissage",
      "fontaine de graissage",
      "fontaine degraissage"
    ],
    label: "Produit fontaine dégraissage",
    codeCED: "14 06 03*",
    categorie: "Déchet dangereux"
  },
  {
    patterns: [
      "solvant non chlor",
      "solvant non chlore"
    ],
    label: "Solvant non chloré",
    codeCED: "07 01 04*",
    categorie: "Déchet dangereux"
  },
  {
    patterns: [
      "solvant chlor",
      "solvant chlore"
    ],
    label: "Solvant chloré",
    codeCED: "14 06 02*",
    categorie: "Déchet dangereux"
  },
  {
    patterns: [
      "emballages souillés",
      "emballage souille",
      "bidon marline",
      "emballages ayant contenu un produit dangereux",
      "bidons souillés"
    ],
    label: "Emballages souillés",
    codeCED: "15 01 10*",
    categorie: "Déchet dangereux"
  },
  {
    patterns: [
      "absorbant souillé",
      "chiffons souillés",
      "flexible hydraulique",
      "epi souillé",
      "epi souille",
      "epi contaminé amiante",
      "epi amiante",
      "epi dangereux"
    ],
    label: "Absorbants, EPI souillés aux produits dangereux (y compris amiante)",
    codeCED: "15 02 02*",
    categorie: "Déchet dangereux"
  },
  {
    patterns: [
      "filtre a huile",
      "filtre huile",
      "filtre a carburant",
      "filtre carburant"
    ],
    label: "Filtres à huile",
    codeCED: "16 01 07*",
    categorie: "Déchet dangereux"
  },
  {
    patterns: [
      "liquide de refroidissement",
      "liquide refroidissement",
      "antigel usagé",
      "antigel usage"
    ],
    label: "Liquide refroidissement / antigel usagés",
    codeCED: "16 01 14*",
    categorie: "Déchet dangereux"
  },
  {
    patterns: [
      "deee",
      "deee en mélange",
      "dechets electriques",
      "dechets electroniques",
      "equipements electriques electroniques"
    ],
    label: "Déchets électriques, électroniques - DEEE",
    codeCED: "16 02 13*",
    categorie: "Déchet dangereux"
  },
  {
    patterns: [
      "aerosol",
      "aérosol",
      "bombes aérosols",
      "bombes aerosol"
    ],
    label: "Aérosols",
    codeCED: "16 05 04*",
    categorie: "Déchet dangereux"
  },
  {
    patterns: [
      "batterie plomb",
      "batteries plomb",
      "batterie au plomb"
    ],
    label: "Batteries au plomb",
    codeCED: "16 06 01*",
    categorie: "Déchet dangereux"
  },
  {
    patterns: [
      "melange bitumineux contenant du goudron",
      "mélange bitumineux contenant du goudron",
      "béton bitumineux contenant du goudron",
      "enrobé pollué",
      "enrobe pollue",
      "enrobe hap"
    ],
    label: "Mélanges bitumineux contenant du goudron",
    codeCED: "17 03 01*",
    categorie: "Déchet dangereux"
  },
  {
    patterns: [
      "terre souillée",
      "terre souillee",
      "terre polluée",
      "terre polluee",
      "sol pollué",
      "sol pollue"
    ],
    label: "Terre souillée",
    codeCED: "17 05 03*",
    categorie: "Déchet dangereux"
  },
  {
    patterns: [
      "amiante",
      "amianté",
      "amiantes",
      "fibrociment",
      "tuyau amiante-ciment",
      "canalisation amiante",
      "dalle amiante",
      "colle amiante",
      "enrobé amianté",
      "enrobe amiante"
    ],
    label: "Matériaux amiantés",
    codeCED: "17 06 05*",
    categorie: "Déchet dangereux"
  },
  {
    patterns: [
      "piles",
      "accumulateurs",
      "pile lithium",
      "pile bouton"
    ],
    label: "Piles et accumulateurs",
    codeCED: "20 01 33*",
    categorie: "Déchet dangereux"
  }
];

