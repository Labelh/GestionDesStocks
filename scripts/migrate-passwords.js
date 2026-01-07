// Script de migration : Synchroniser les mots de passe Supabase Auth avec les numéros de badge
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

async function migratePasswords() {
  console.log('🔄 Début de la migration des mots de passe...\n');

  try {
    // 1. Récupérer tous les profils utilisateurs qui ont un badge
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, username, name, badge_number')
      .not('badge_number', 'is', null)
      .neq('badge_number', '');

    if (profilesError) {
      throw new Error(`Erreur lors de la récupération des profils: ${profilesError.message}`);
    }

    console.log(`📋 ${profiles.length} utilisateur(s) avec badge trouvé(s)\n`);

    // 2. Pour chaque profil, mettre à jour le mot de passe Supabase Auth
    let successCount = 0;
    let errorCount = 0;

    for (const profile of profiles) {
      console.log(`⚙️  Migration pour ${profile.name} (${profile.username})...`);

      try {
        // Récupérer l'utilisateur Auth par email
        const email = `${profile.username}@gestionstocks.app`;
        const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();

        if (listError) {
          throw listError;
        }

        const authUser = authUsers.users.find(u => u.email === email);

        if (!authUser) {
          console.log(`  ⚠️  Utilisateur Auth non trouvé pour ${email}`);
          errorCount++;
          continue;
        }

        // Mettre à jour le mot de passe pour correspondre au badge
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          authUser.id,
          { password: profile.badge_number }
        );

        if (updateError) {
          throw updateError;
        }

        console.log(`  ✅ Mot de passe synchronisé avec le badge: ${profile.badge_number}`);
        successCount++;
      } catch (err) {
        console.error(`  ❌ Erreur pour ${profile.name}:`, err.message);
        errorCount++;
      }

      console.log('');
    }

    console.log('═══════════════════════════════════════');
    console.log(`✅ Migration terminée avec succès !`);
    console.log(`   - Réussis: ${successCount}`);
    console.log(`   - Échecs: ${errorCount}`);
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Erreur fatale:', error.message);
    process.exit(1);
  }
}

// Exécuter la migration
migratePasswords();
