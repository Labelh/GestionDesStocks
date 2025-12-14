# Configuration Supabase Requise

## Problème de Création d'Utilisateur (Erreur 400)

Si vous obtenez une erreur 400 lors de la création d'utilisateurs, c'est probablement dû à la configuration de la confirmation d'email dans Supabase.

### Solution : Configuration de l'Authentification Email

1. Allez dans votre dashboard Supabase : https://jxymbulpvnzzysfcsxvw.supabase.co

2. Naviguez vers **Authentication** → **Providers** → **Email**

3. **ACTIVEZ** "Enable Email provider" (doit être ON)

4. **DÉSACTIVEZ** "Confirm email" (doit être OFF)

5. Sauvegardez les modifications

**Important** :
- ✅ "Enable Email provider" = **ON** (permet les inscriptions)
- ❌ "Confirm email" = **OFF** (pas de confirmation requise)

### Pourquoi cette configuration est nécessaire ?

L'application utilise des emails fictifs au format `username@gestionstocks.app` pour créer des comptes Supabase Auth. Ces emails ne sont pas réels, donc Supabase ne peut pas envoyer de confirmation.

En désactivant la confirmation d'email, les utilisateurs peuvent être créés immédiatement sans avoir besoin de confirmer leur email.

## Migration de la Colonne badge_number

Pour que la sauvegarde des badges fonctionne, vous devez exécuter cette migration SQL :

1. Allez dans **SQL Editor** dans votre dashboard Supabase

2. Exécutez le script suivant :

```sql
-- Vérifier si la colonne existe
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'user_profiles' AND column_name = 'badge_number';

-- Si elle n'existe pas, exécutez ces commandes :
ALTER TABLE user_profiles
ADD COLUMN badge_number TEXT UNIQUE;

CREATE INDEX idx_user_profiles_badge_number ON user_profiles(badge_number);

COMMENT ON COLUMN user_profiles.badge_number IS 'Numéro de badge unique pour l''authentification par scan code-barre';
```

3. Vérifiez que la colonne a été ajoutée en allant dans **Table Editor** → **user_profiles**

## Autres Configurations Recommandées

### Politique de Mot de Passe

Si vous avez des problèmes avec les mots de passe :

1. Allez dans **Authentication** → **Settings**
2. Vérifiez les **Password requirements**
3. Assurez-vous que les mots de passe que vous utilisez respectent ces critères

### Row Level Security (RLS)

Les politiques RLS sont déjà configurées dans le schéma SQL (`supabase-schema.sql`). Assurez-vous qu'elles sont bien appliquées :

```sql
-- Vérifier que RLS est activé
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'user_profiles';
```

## Dépannage

### Erreur : "User already registered"

Si un utilisateur avec le même username a été créé puis supprimé, l'email existe toujours dans Supabase Auth. Solutions :

1. Utilisez un username différent
2. Ou supprimez l'utilisateur de Supabase Auth :
   - Allez dans **Authentication** → **Users**
   - Trouvez l'utilisateur avec l'email correspondant
   - Supprimez-le complètement

### Erreur : "canceling statement due to statement timeout"

Cela indique que certaines requêtes prennent trop de temps. Vérifiez :

1. Les index sont bien créés (voir `supabase-schema.sql`)
2. La base de données n'a pas trop de données
3. Les requêtes sont optimisées

Pour les demandes de sortie, ajoutez un index si nécessaire :

```sql
CREATE INDEX IF NOT EXISTS idx_exit_requests_requested_at
ON exit_requests(requested_at DESC);
```
