# Guide : Connecter Supabase à FluxMat

## Étape 1 : Récupérer vos clés dans Supabase

1. Allez sur https://supabase.com et connectez-vous
2. Sélectionnez votre projet (ou créez-en un si nécessaire)
3. Allez dans **Settings** (⚙️) → **API**

Vous verrez 3 informations importantes :

### A. Project URL
- Trouvez la section **Project URL**
- Cliquez sur **Copy** à côté de l'URL
- Elle ressemble à : `https://xxxxxxxxxxxxx.supabase.co`
- ⚠️ **C'EST VOTRE NEXT_PUBLIC_SUPABASE_URL**

### B. API Keys
- Dans la section **API Keys**, vous avez deux clés :

#### 1. Anon / Public Key (optionnel pour ce projet)
- Cliquez sur **Copy** à côté de "anon public"
- C'est la clé publique (visible dans le navigateur)
- ⚠️ **C'EST VOTRE NEXT_PUBLIC_SUPABASE_ANON_KEY** (optionnel)

#### 2. Service Role / Secret Key (OBLIGATOIRE)
- Cliquez sur **Reveal** pour voir la clé (elle est masquée par défaut)
- Cliquez sur **Copy** à côté de "service_role secret"
- ⚠️ **C'EST VOTRE SUPABASE_SERVICE_ROLE_KEY** (SECRÈTE - ne jamais partager !)

---

## Étape 2 : Créer le fichier .env.local

1. À la **racine** de votre projet FluxMat, créez un fichier nommé exactement : `.env.local`
   - Pas `.env` 
   - Pas `.env.local.txt`
   - Exactement : `.env.local`

2. Ouvrez ce fichier avec un éditeur de texte (Notepad++, VS Code, etc.)

3. Copiez-collez EXACTEMENT ce format (remplacez avec VOS valeurs) :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **IMPORTANT :**
- Pas d'espaces autour du `=`
- Pas de guillemets `"` ou `'`
- Chaque variable sur une ligne
- Copiez-collez les valeurs directement depuis Supabase

4. Sauvegardez le fichier

---

## Étape 3 : Vérifier que le fichier est au bon endroit

Le fichier `.env.local` doit être **exactement ici** :
```
C:\Users\Maxime\Desktop\Eiffage\Fluxmat\.env.local
```

À côté de ces fichiers :
- `package.json`
- `next.config.mjs`
- `app/`
- `components/`

---

## Étape 4 : Redémarrer le serveur

1. **Arrêtez complètement** le serveur :
   - Dans le terminal, appuyez sur `Ctrl + C`
   - Attendez qu'il s'arrête complètement

2. **Videz le cache Next.js** :
   ```powershell
   Remove-Item -Recurse -Force .next
   ```

3. **Relancez le serveur** :
   ```powershell
   npm run dev
   ```

---

## Étape 5 : Tester la connexion

Une fois le serveur démarré, testez dans votre navigateur :

```
http://192.168.1.246:3000/api/health
```

Vous devriez voir :
```json
{
  "status": "ok",
  "connected": true,
  "message": "Base de données connectée"
}
```

---

## Dépannage

### Le serveur dit toujours "Supabase non configuré"

1. Vérifiez que le fichier s'appelle bien `.env.local` (pas `.env.local.txt`)
2. Vérifiez qu'il est à la racine du projet
3. Vérifiez qu'il n'y a pas d'espaces autour du `=`
4. **Redémarrez complètement** le serveur (étape 4)

### Vérifier ce que Next.js voit

Testez cette route :
```
http://192.168.1.246:3000/api/test-env
```

Elle vous dira exactement quelles variables sont chargées.

---

## Résumé rapide

1. ✅ Récupérez Project URL et Service Role Key dans Supabase
2. ✅ Créez `.env.local` à la racine avec ces 2 variables
3. ✅ Format : `NOM_VARIABLE=valeur` (pas d'espaces)
4. ✅ Redémarrez le serveur complètement
5. ✅ Testez `/api/health`

