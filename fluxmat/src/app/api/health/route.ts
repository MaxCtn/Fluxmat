export async function GET() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ]
  const missing = required.filter((k) => !process.env[k])
  return Response.json({ ok: missing.length === 0, missing })
}
