# Fluxmat - Déploiement Vercel

## Variables d'environnement requises

Configurez ces variables dans Vercel Dashboard > Settings > Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://ionbzssgyskmmhxuvvqb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Commandes de déploiement

1. **Installation Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login Vercel**:
   ```bash
   vercel login
   ```

3. **Déploiement**:
   ```bash
   vercel --prod
   ```

## Configuration Vercel

- **Framework**: Next.js
- **Build Command**: `pnpm build`
- **Output Directory**: `.next`
- **Install Command**: `pnpm install`

## URLs importantes

- **Team ID**: team_0S2vLkYZAOGYim7tEspTP3MF
- **Project ID**: prj_54IQHInUNPfQrzjEms2hrZSKvkUf
