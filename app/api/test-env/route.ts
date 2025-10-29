import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  // Cette route affiche l'état exact des variables d'environnement
  // (sans exposer les valeurs complètes pour la sécurité)
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: {
      exists: !!url,
      length: url?.length || 0,
      starts_with_https: url?.startsWith('https://') || false,
      preview: url ? `${url.substring(0, 30)}...` : 'NON DÉFINI'
    },
    SUPABASE_SERVICE_ROLE_KEY: {
      exists: !!key,
      length: key?.length || 0,
      starts_with_eyJ: key?.startsWith('eyJ') || false,
      preview: key ? `${key.substring(0, 20)}...` : 'NON DÉFINI'
    },
    NEXT_PUBLIC_SUPABASE_ANON_KEY: {
      exists: !!anon,
      length: anon?.length || 0
    },
    // Vérifier tous les process.env qui commencent par NEXT_PUBLIC ou SUPABASE
    all_env_vars: Object.keys(process.env)
      .filter(k => k.includes('SUPABASE') || k.includes('NEXT_PUBLIC'))
      .map(k => ({ name: k, exists: true, length: process.env[k]?.length || 0 }))
  });
}

