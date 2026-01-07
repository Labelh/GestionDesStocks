// Script de debug : Lister tous les utilisateurs Auth et leur relation avec les profils
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
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function debugAuth() {
  console.log('🔍 Debug des comptes Auth et Profils\n');

  try {
    // 1. Lister tous les utilisateurs Auth
    console.log('═══ UTILISATEURS AUTH ═══');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      throw authError;
    }

    console.log(`Total: ${authData.users.length} utilisateurs Auth\n`);

    authData.users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Créé: ${new Date(user.created_at).toLocaleString()}`);
      console.log('');
    });

    // 2. Lister tous les profils
    console.log('\n═══ PROFILS UTILISATEURS ═══');
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, username, name, badge_number, role')
      .order('name');

    if (profilesError) {
      throw profilesError;
    }

    console.log(`Total: ${profiles.length} profils\n`);

    profiles.forEach((profile, index) => {
      const email = `${profile.username}@gestionstocks.app`;
      const authUser = authData.users.find(u => u.email === email);

      console.log(`${index + 1}. ${profile.name} (${profile.username}) - ${profile.role}`);
      console.log(`   ID Profil: ${profile.id}`);
      console.log(`   Email: ${email}`);
      console.log(`   Badge: ${profile.badge_number || 'NON DÉFINI'}`);
      console.log(`   Auth: ${authUser ? `✅ ID ${authUser.id}` : '❌ MANQUANT'}`);

      if (authUser && authUser.id !== profile.id) {
        console.log(`   ⚠️  IDs différents !`);
      }

      console.log('');
    });

    // 3. Tester la connexion avec badge pour le gestionnaire
    console.log('\n═══ TEST CONNEXION GESTIONNAIRE ═══');
    const manager = profiles.find(p => p.role === 'manager');

    if (manager && manager.badge_number) {
      console.log(`Tentative de connexion pour ${manager.name}`);
      console.log(`Email: ${manager.username}@gestionstocks.app`);
      console.log(`Badge (mot de passe): ${manager.badge_number}`);

      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email: `${manager.username}@gestionstocks.app`,
        password: manager.badge_number
      });

      if (error) {
        console.log(`❌ Échec: ${error.message}`);

        // Essayer de mettre à jour le mot de passe
        const authUser = authData.users.find(u => u.email === `${manager.username}@gestionstocks.app`);
        if (authUser) {
          console.log(`\n🔄 Tentative de mise à jour du mot de passe...`);
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            authUser.id,
            { password: manager.badge_number }
          );

          if (updateError) {
            console.log(`❌ Échec mise à jour: ${updateError.message}`);
          } else {
            console.log(`✅ Mot de passe mis à jour avec succès !`);
          }
        }
      } else {
        console.log(`✅ Connexion réussie !`);
      }
    } else {
      console.log('❌ Gestionnaire avec badge non trouvé');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

debugAuth();
