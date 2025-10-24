# Configuration Supabase sur Vercel

## ❌ Problème actuel

```
TypeError: fetch failed
```

Cette erreur vient du fait que **les variables d'environnement Supabase ne sont pas configurées sur Vercel**.

---

## ✅ Solution en 3 étapes

### **1️⃣ Récupérer vos credentials Supabase**

1. Allez sur https://app.supabase.com/
2. Sélectionnez votre projet FluxMat
3. Allez dans **Settings → API** (en bas à gauche)
4. Copiez et gardez à portée de main :
   - **Project URL** (ex: `https://ionbzssgyskmmhxuvvqb.supabase.co`)
   - **Service Role secret** (attention: c'est LA clé admin, à garder secrète !)

### **2️⃣ Configurer les variables sur Vercel**

1. Allez sur https://vercel.com/dashboard
2. Cliquez sur votre projet **fluxmat**
3. Cliquez sur **Settings** (en haut)
4. Cliquez sur **Environment Variables** (dans le menu de gauche)
5. **Ajoutez deux variables** :

| Nom | Valeur | Environnement |
|-----|--------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ionbzssgyskmmhxuvvqb.supabase.co` | Production |
| `SUPABASE_SERVICE_ROLE` | `eyJ...` (votre clé service role) | Production |

6. Cliquez **Save** après chaque ajout

### **3️⃣ Redéployer**

Vercel redéploiera automatiquement avec les nouvelles variables. Attendez 1-2 minutes, puis testez :

```
https://fluxmat.vercel.app/api/db/summary
```

---

## 🔍 Vérification

Allez sur Vercel → Deployments et regardez les **logs** :

- ✅ Si vous voyez `[SUPABASE] Client Supabase créé avec succès` → C'est bon !
- ❌ Si vous voyez `Variables d'environnement manquantes` → Relisez l'étape 2

---

## 🔐 Notes de sécurité

- **JAMAIS** hardcoder les clés Supabase dans le code
- La clé `SUPABASE_SERVICE_ROLE` est **admin** → À garder secrète
- Ne commitez **JAMAIS** des fichiers `.env` avec les vraies clés
- Utilisez toujours les **Environment Variables** de Vercel

---

## ⚠️ Problème potentiel

Si même après avoir configuré les variables ça ne marche pas :
- La clé Supabase peut être **expirée**
- Générez une nouvelle clé dans Supabase : Settings → API → Regenerate

Good luck ! 🚀
