# 🔒 Guide de Sécurité - FluxMat

## ⚠️ RÈGLE D'OR

**JAMAIS committer les clés API ou les fichiers `.env` avec les vraies valeurs sur GitHub !**

---

## 🚫 Ce qu'on NE DOIT PAS faire

```javascript
// ❌ DANGEREUX - Clés hardcodées dans le code
const SUPABASE_KEY = 'eyJhbGc...';
```

```bash
# ❌ DANGEREUX - Committer .env avec vraies clés
git add .env
git commit -m "Add env variables"
```

```javascript
// ❌ DANGEREUX - Clés dans les commentaires
// API Key: eyJhbGc...
```

---

## ✅ Ce qu'on DOIT faire

### **1. Développement Local**

```bash
# Dupliquez le fichier template
cp .env.example .env.local

# Éditez avec vos vraies clés (ne sera jamais committé)
# .env.local sera ignoré par .gitignore
```

### **2. Production (Vercel)**

**JAMAIS créer de `.env` !** Utilisez les variables d'environnement Vercel :

1. Allez sur https://vercel.com/dashboard
2. Sélectionnez **fluxmat**
3. **Settings → Environment Variables**
4. Ajoutez vos variables
5. **Save** (Vercel redéploiera automatiquement)

### **3. Dans le Code**

Lisez TOUJOURS depuis les variables d'environnement :

```javascript
// ✅ BON
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE;

// ❌ MAUVAIS
const key = 'eyJhbGc...'; // Hardcodée !
```

---

## 📋 Checklist de Sécurité

- [ ] `.env` est dans `.gitignore`
- [ ] `.env.local` est dans `.gitignore`
- [ ] Tous les `.env.*` sauf `.env.example` sont ignorés
- [ ] Aucune vraie clé dans les fichiers committes
- [ ] Variables configurées sur Vercel
- [ ] Code utilise `process.env.*` pour lire les clés
- [ ] `.env.example` existe avec des valeurs placeholders

---

## 🔑 Types de Clés

### **NEXT_PUBLIC_SUPABASE_URL**
- ✅ **PUBLIC** (peut être visée côté client)
- ✅ Visible dans le code
- ✅ Dans `.env.local` ET sur Vercel

### **SUPABASE_SERVICE_ROLE**
- 🔴 **SECRÈTE** (admin uniquement)
- ❌ Ne JAMAIS committer
- ❌ Uniquement sur Vercel (variables d'environnement)
- ❌ Ne pas exposer au client

---

## 🚨 Si une clé a été exposée

1. **Régénérez immédiatement** une nouvelle clé dans Supabase
2. Mettez à jour sur Vercel
3. Supprimez les clés sensibles du git history si besoin
4. Vérifiez les logs de Supabase pour les accès suspects

---

## 📚 Références

- [Supabase Security](https://supabase.com/docs/guides/security)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [GitHub: Managing Secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)

---

## 💡 Astuce

Pour vérifier que rien de sensible n'est committé :

```bash
# Chercher les patterns sensibles
git log -p | grep -i "api_key\|secret\|password"

# Ou chercher les fichiers .env
git log --full-history -- .env .env.local
```

**Restez vigilant ! 🔒**
