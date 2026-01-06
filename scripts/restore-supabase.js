#!/usr/bin/env node

/**
 * Script de restauration pour Supabase
 *
 * Ce script restaure les données depuis un fichier de backup JSON
 *
 * Usage:
 *   node scripts/restore-supabase.js <chemin-vers-backup.json>
 *
 * Exemple:
 *   node scripts/restore-supabase.js backups/backup-supabase-2025-01-06T10-30-00.json
 *
 * ATTENTION: Ce script va REMPLACER les données existantes dans les tables!
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

// Charger les variables d'environnement
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Vérifier la configuration
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Erreur: VITE_SUPABASE_URL et SUPABASE_SERVICE_KEY doivent être définis');
  process.exit(1);
}

// Récupérer le fichier de backup
const backupFile = process.argv[2];

if (!backupFile) {
  console.error('❌ Erreur: Vous devez spécifier un fichier de backup');
  console.error('   Usage: node scripts/restore-supabase.js <fichier-backup.json>');
  process.exit(1);
}

if (!fs.existsSync(backupFile)) {
  console.error(`❌ Erreur: Le fichier ${backupFile} n'existe pas`);
  process.exit(1);
}

// Créer le client Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Demander confirmation à l'utilisateur
 */
function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'oui' || answer.toLowerCase() === 'o');
    });
  });
}

/**
 * Restaure les données d'une table
 */
async function restoreTable(tableName, data, mode = 'replace') {
  console.log(`📦 Restauration de ${tableName} (${data.length} enregistrements)...`);

  try {
    if (mode === 'replace') {
      // Supprimer toutes les données existantes
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Supprimer tout

      if (deleteError) {
        console.error(`   ⚠️  Avertissement lors de la suppression: ${deleteError.message}`);
      }
    }

    // Insérer les données par lots de 100
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);

      const { error } = await supabase
        .from(tableName)
        .insert(batch);

      if (error) {
        console.error(`   ❌ Erreur lors de l'insertion (lot ${i / batchSize + 1}):`, error.message);
      } else {
        inserted += batch.length;
      }
    }

    console.log(`   ✅ ${inserted}/${data.length} enregistrements restaurés`);
    return { tableName, inserted, total: data.length };
  } catch (err) {
    console.error(`   ❌ Exception pour ${tableName}:`, err.message);
    return { tableName, inserted: 0, total: data.length, error: err.message };
  }
}

/**
 * Fonction principale de restauration
 */
async function performRestore() {
  console.log('🔄 Démarrage de la restauration Supabase...\n');

  // Charger le fichier de backup
  console.log(`📂 Chargement du backup: ${backupFile}`);
  const backupContent = fs.readFileSync(backupFile, 'utf8');
  const backup = JSON.parse(backupContent);

  // Afficher les informations du backup
  console.log('\n📊 Informations du backup:');
  console.log(`   Date: ${backup.metadata.timestamp}`);
  console.log(`   Tables: ${backup.metadata.totalTables}`);
  console.log(`   Enregistrements: ${backup.metadata.totalRecords}`);
  console.log(`   Source: ${backup.metadata.supabaseUrl}\n`);

  // Demander confirmation
  const confirmed = await askConfirmation(
    '⚠️  ATTENTION: Cette opération va REMPLACER toutes les données existantes.\n' +
    '   Voulez-vous continuer? (oui/non): '
  );

  if (!confirmed) {
    console.log('❌ Restauration annulée');
    process.exit(0);
  }

  const startTime = Date.now();
  let totalRestored = 0;

  // Ordre de restauration (tables sans dépendances d'abord)
  const restoreOrder = [
    'categories',
    'units',
    'storage_zones',
    'user_profiles',
    'products',
    'stock_movements',
    'exit_requests',
    'orders',
    'pending_exits',
    'stock_alerts',
    'user_cart'
  ];

  // Restaurer les tables dans l'ordre
  for (const tableName of restoreOrder) {
    if (backup.data[tableName] && backup.data[tableName].length > 0) {
      const result = await restoreTable(tableName, backup.data[tableName]);
      totalRestored += result.inserted;
    } else {
      console.log(`⏭️  Table ${tableName} ignorée (vide ou absente)`);
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n✅ Restauration terminée!');
  console.log(`   📝 Enregistrements restaurés: ${totalRestored}`);
  console.log(`   ⏱️  Durée: ${duration}s`);
}

// Exécuter la restauration
performRestore().catch(err => {
  console.error('❌ Erreur fatale:', err);
  process.exit(1);
});
