import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  // Cette route ne doit être utilisée qu'en développement pour vérifier la configuration
  // NE PAS exposer les valeurs réelles en production !
  
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // On affiche seulement si les variables existent, pas leurs valeurs
  const urlLength = process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0;
  const keyLength = process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0;
  
  // Vérifier si les valeurs ne sont pas vides
  const urlValid = hasUrl && urlLength > 0;
  const keyValid = hasKey && keyLength > 0;
  
  // Vérifier le format de l'URL
  let urlFormat = 'non vérifié';
  if (hasUrl && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (url.startsWith('https://') && url.includes('.supabase.co')) {
      urlFormat = 'valide';
    } else {
      urlFormat = 'format suspect';
    }
  }
  
  return NextResponse.json({
    env_vars_status: {
      NEXT_PUBLIC_SUPABASE_URL: {
        exists: hasUrl,
        has_value: urlValid,
        length: urlLength,
        format: urlFormat
      },
      SUPABASE_SERVICE_ROLE_KEY: {
        exists: hasKey,
        has_value: keyValid,
        length: keyLength,
        note: 'La clé doit commencer par "eyJ"' // Les service role keys Supabase commencent par eyJ
      }
    },
    all_configured: urlValid && keyValid,
    recommendations: [
      !hasUrl && 'Créer le fichier .env.local à la racine du projet',
      hasUrl && !urlValid && 'NEXT_PUBLIC_SUPABASE_URL est défini mais vide',
      hasKey && !keyValid && 'SUPABASE_SERVICE_ROLE_KEY est défini mais vide',
      urlValid && keyValid && 'Configuration correcte! Redémarrez le serveur si nécessaire.'
    ].filter(Boolean)
  });
}

