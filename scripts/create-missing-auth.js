// Script de migration : Créer les comptes Supabase Auth manquants pour les utilisateurs avec badge
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.error('Assurez-vous que VITE_SUPABASE_URL et SUPABASE_SERVICE_KEY sont définis dans .env.local');
  process.exit(1);
}

// Créer un client Supabase avec la clé service (admin)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createMissingAuthAccounts() {
  console.log('🔄 Création des comptes Auth manquants...\n');

  try {
    // 1. Récupérer tous les profils utilisateurs
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, username, name, badge_number, role');

    if (profilesError) {
      throw new Error(`Erreur lors de la récupération des profils: ${profilesError.message}`);
    }

    console.log(`📋 ${profiles.length} profil(s) utilisateur trouvé(s)\n`);

    // 2. Récupérer tous les utilisateurs Auth existants
    const { data: authData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      throw listError;
    }

    const existingEmails = new Set(authData.users.map(u => u.email));

    // 3. Pour chaque profil, vérifier si le compte Auth existe
    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const profile of profiles) {
      const email = `${profile.username}@gestionstocks.app`;

      console.log(`⚙️  Vérification pour ${profile.name} (${profile.username})...`);

      if (existingEmails.has(email)) {
        console.log(`  ⏭️  Compte Auth déjà existant`);

        // Si l'utilisateur a un badge, synchroniser le mot de passe
        if (profile.badge_number && profile.badge_number.trim() !== '') {
          try {
            const authUser = authData.users.find(u => u.email === email);
            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
              authUser.id,
              { password: profile.badge_number }
            );

            if (updateError) {
              throw updateError;
            }

            console.log(`  🔄 Mot de passe synchronisé avec badge: ${profile.badge_number}`);
          } catch (err) {
            console.error(`  ⚠️  Erreur lors de la synchro du mot de passe:`, err.message);
          }
        }

        skippedCount++;
        console.log('');
        continue;
      }

      // Créer le compte Auth
      try {
        // Utiliser le badge comme mot de passe si disponible, sinon un mot de passe par défaut
        const password = profile.badge_number && profile.badge_number.trim() !== ''
          ? profile.badge_number
          : `${profile.username}123!`;

        const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: email,
          password: password,
          email_confirm: true,
          user_metadata: {
            username: profile.username,
            name: profile.name
          }
        });

        if (createError) {
          throw createError;
        }

        console.log(`  ✅ Compte Auth créé avec mot de passe: ${password}`);

        // Mettre à jour l'ID du profil pour correspondre à l'ID Auth si nécessaire
        if (profile.id !== authUser.user.id) {
          console.log(`  ⚠️  IDs différents - Profile: ${profile.id}, Auth: ${authUser.user.id}`);
          console.log(`  ℹ️  L'ID du profil sera maintenu tel quel`);
        }

        createdCount++;
      } catch (err) {
        console.error(`  ❌ Erreur lors de la création:`, err.message);
        errorCount++;
      }

      console.log('');
    }

    console.log('═══════════════════════════════════════');
    console.log(`✅ Migration terminée !`);
    console.log(`   - Comptes créés: ${createdCount}`);
    console.log(`   - Déjà existants: ${skippedCount}`);
    console.log(`   - Échecs: ${errorCount}`);
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Erreur fatale:', error.message);
    process.exit(1);
  }
}

// Exécuter la migration
createMissingAuthAccounts();
