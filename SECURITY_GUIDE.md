# Guide de Sécurité - Gestion des Stocks

## 🔐 Sécurisation des Clés API

### Étape 1 : Régénérer les Clés Supabase Compromises

**IMPORTANT** : Les anciennes clés ont été exposées dans le code source. Vous DEVEZ les régénérer immédiatement.

1. Connectez-vous à votre projet Supabase : https://app.supabase.com
2. Allez dans **Settings** > **API**
3. Dans la section **Project API keys**, cliquez sur **Reset anon key**
4. Confirmez la régénération
5. Copiez la nouvelle clé

### Étape 2 : Configuration Locale

1. Créez un fichier `.env.local` à la racine du projet (s'il n'existe pas déjà)
2. Ajoutez vos nouvelles clés :

```bash
VITE_SUPABASE_URL=https://jxymbulpvnzzysfcsxvw.supabase.co
VITE_SUPABASE_ANON_KEY=votre-nouvelle-cle-ici
VITE_API_URL=http://localhost:3001/api
```

3. Vérifiez que `.env.local` est dans le fichier `.gitignore`

### Étape 3 : Configuration GitHub Actions (Production)

Pour le déploiement automatique sur GitHub Pages :

1. Allez sur votre dépôt GitHub
2. **Settings** > **Secrets and variables** > **Actions**
3. Cliquez sur **New repository secret**
4. Ajoutez les secrets suivants :
   - Nom : `VITE_SUPABASE_URL`
   - Valeur : Votre URL Supabase

   - Nom : `VITE_SUPABASE_ANON_KEY`
   - Valeur : Votre nouvelle clé anon

### Étape 4 : Mettre à jour le Workflow GitHub

Vérifiez que votre `.github/workflows/deploy.yml` utilise les secrets :

```yaml
- name: Build
  env:
    VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
    VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
  run: npm run build
```

## 🛡️ Row Level Security (RLS)

### Tables à Sécuriser

Exécutez ces commandes dans l'éditeur SQL de Supabase pour activer la sécurité au niveau des lignes :

```sql
-- Activer RLS sur toutes les tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE exit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_exits ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;
-- user_cart a déjà RLS activé

-- Politiques pour user_profiles
CREATE POLICY "Les utilisateurs peuvent lire tous les profils"
  ON user_profiles FOR SELECT
  USING (true);

CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Politiques pour products (lecture pour tous, modification manager uniquement)
CREATE POLICY "Tout le monde peut lire les produits"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Seuls les managers peuvent modifier les produits"
  ON products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Politiques pour stock_movements (lecture pour tous, insertion automatique)
CREATE POLICY "Tout le monde peut lire les mouvements de stock"
  ON stock_movements FOR SELECT
  USING (true);

CREATE POLICY "Les utilisateurs authentifiés peuvent créer des mouvements"
  ON stock_movements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politiques pour exit_requests
CREATE POLICY "Les utilisateurs voient leurs propres demandes"
  ON exit_requests FOR SELECT
  USING (
    auth.uid()::text = requested_by OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY "Les utilisateurs peuvent créer des demandes"
  ON exit_requests FOR INSERT
  WITH CHECK (auth.uid()::text = requested_by);

-- Politiques pour orders
CREATE POLICY "Seuls les managers peuvent voir les commandes"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Politiques pour les tables de configuration (categories, units, storage_zones)
CREATE POLICY "Tout le monde peut lire les catégories"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Seuls les managers peuvent modifier les catégories"
  ON categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY "Tout le monde peut lire les unités"
  ON units FOR SELECT
  USING (true);

CREATE POLICY "Seuls les managers peuvent modifier les unités"
  ON units FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY "Tout le monde peut lire les zones de stockage"
  ON storage_zones FOR SELECT
  USING (true);

CREATE POLICY "Seuls les managers peuvent modifier les zones de stockage"
  ON storage_zones FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );
```

## 🔒 Checklist de Sécurité

- [ ] Régénérer les clés Supabase
- [ ] Configurer les secrets GitHub Actions
- [ ] Supprimer toutes les clés hardcodées du code
- [ ] Activer RLS sur toutes les tables
- [ ] Vérifier que `.env.local` est dans `.gitignore`
- [ ] Tester l'application avec les nouvelles clés
- [ ] Vérifier que le build de production fonctionne
- [ ] Auditer les logs Supabase pour détecter les accès non autorisés

## 🚨 En Cas de Fuite de Clés

Si vous découvrez que vos clés ont été exposées :

1. **Immédiatement** : Révoquez les clés dans Supabase
2. Générez de nouvelles clés
3. Mettez à jour `.env.local` et les secrets GitHub
4. Vérifiez les logs d'accès Supabase pour détecter toute activité suspecte
5. Envisagez de réinitialiser les mots de passe des utilisateurs si nécessaire
6. Auditez les modifications de données récentes

## 📞 Support

Pour toute question de sécurité, consultez :
- Documentation Supabase : https://supabase.com/docs/guides/auth/row-level-security
- GitHub Secrets : https://docs.github.com/en/actions/security-guides/encrypted-secrets
