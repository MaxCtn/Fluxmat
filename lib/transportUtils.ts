import { normalizeText } from "./wasteUtils";

export function isCamionLike(
  libelleRessource?: string,
  rubriqueComptable?: string
): boolean {
  if (!libelleRessource && !rubriqueComptable) return false;

  const nLabel = normalizeText(libelleRessource ?? "");
  const nRub = normalizeText(rubriqueComptable ?? "");

  // Exclusions évidentes (pelles, compactage, rouleaux...)
  if (/\b(minipelle|pelle|briseroche|compactage|roul\.?|rouleau)\b/.test(nLabel)) {
    return false;
  }

  // Rubriques qui identifient un camion / transport
  if (nRub.includes("loc camions")) return true;
  if (nRub.includes("loc int. camions") || nRub.includes("loc int camions")) return true;
  if (nRub.includes("loc int. mat transport") || nRub.includes("loc int mat transport")) return true;
  if (nRub.includes("loc materiel de transport")) return true;

  // Indices forts dans le libellé
  if (/\b(camion|benne|bibenne|p8x4|8x4|6x4|3t5|3\.5t|tp7)\b/.test(nLabel)) {
    return true;
  }

  if (nLabel.includes("c 480")) return true;
  if (nLabel.includes("master 35.120")) return true;

  return false;
}

export function detectTruckType(libelleRessource?: string): string | null {
  if (!libelleRessource) return null;
  const n = normalizeText(libelleRessource);

  if (/\b(p8x4|8x4)\b/.test(n)) {
    if (n.includes("bibenne") || n.includes("benne")) {
      return "Camion 8x4 bi-benne";
    }
    return "Camion 8x4";
  }

  if (/\b6x4\b/.test(n)) {
    if (n.includes("benne") || n.includes("bibenne")) {
      return "Camion 6x4 benne";
    }
    return "Camion 6x4";
  }

  if (/\b(3t5|3\.5t|3,5t)\b/.test(n)) {
    if (n.includes("master")) {
      return "Véhicule 3,5 T type Master benne";
    }
    return "Véhicule 3,5 T benne";
  }

  if (n.includes("bibenne")) return "Camion bi-benne";
  if (n.includes("benne")) return "Camion benne";
  if (n.includes("master")) return "Véhicule utilitaire type Master";
  if (n.includes("camion")) return "Camion";

  return "Camion (type non précisé)";
}

