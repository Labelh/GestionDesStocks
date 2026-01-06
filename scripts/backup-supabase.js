#!/usr/bin/env node

/**
 * Script de sauvegarde automatisé pour Supabase
 *
 * Ce script exporte toutes les données importantes de Supabase
 * dans un fichier JSON horodaté.
 *
 * Usage:
 *   node scripts/backup-supabase.js
 *
 * Configuration requise:
 *   - Variables d'environnement SUPABASE_URL et SUPABASE_SERVICE_KEY
 *   - ou fichier .env avec ces variables
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Charger les variables d'environnement
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // Clé service, pas anon key
const BACKUP_DIR = path.join(__dirname, '../backups');

// Vérifier la configuration
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Erreur: VITE_SUPABASE_URL et SUPABASE_SERVICE_KEY doivent être définis');
  console.error('   Ajoutez SUPABASE_SERVICE_KEY à votre fichier .env.local');
  console.error('   Vous pouvez la trouver dans Supabase > Settings > API > service_role key');
  process.exit(1);
}

// Créer le client Supabase avec la clé service (bypass RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Tables à sauvegarder
const TABLES = [
  'user_profiles',
  'categories',
  'units',
  'storage_zones',
  'products',
  'exit_requests',
  'stock_movements',
  'orders',
  'pending_exits',
  'stock_alerts',
  'user_cart'
];

/**
 * Exporte toutes les données d'une table
 */
async function backupTable(tableName) {
  console.log(`📦 Sauvegarde de ${tableName}...`);

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(10000); // Ajustez selon vos besoins

    if (error) {
      console.error(`   ❌ Erreur pour ${tableName}:`, error.message);
      return { tableName, error: error.message, count: 0 };
    }

    console.log(`   ✅ ${data.length} enregistrements sauvegardés`);
    return { tableName, data, count: data.length };
  } catch (err) {
    console.error(`   ❌ Exception pour ${tableName}:`, err.message);
    return { tableName, error: err.message, count: 0 };
  }
}

/**
 * Fonction principale de sauvegarde
 */
async function performBackup() {
  console.log('🚀 Démarrage de la sauvegarde Supabase...\n');

  // Créer le dossier de backup s'il n'existe pas
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const startTime = Date.now();
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];

  // Sauvegarder toutes les tables
  const results = {};
  let totalRecords = 0;

  for (const table of TABLES) {
    const result = await backupTable(table);
    results[table] = result.data || [];
    totalRecords += result.count;
  }

  // Métadonnées de sauvegarde
  const backup = {
    metadata: {
      timestamp: new Date().toISOString(),
      version: '1.0',
      totalTables: TABLES.length,
      totalRecords,
      supabaseUrl: SUPABASE_URL
    },
    data: results
  };

  // Enregistrer le fichier de backup
  const filename = `backup-supabase-${timestamp}.json`;
  const filepath = path.join(BACKUP_DIR, filename);

  fs.writeFileSync(filepath, JSON.stringify(backup, null, 2), 'utf8');

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  const fileSize = (fs.statSync(filepath).size / 1024 / 1024).toFixed(2);

  console.log('\n✅ Sauvegarde terminée avec succès!');
  console.log(`   📁 Fichier: ${filename}`);
  console.log(`   📊 Tables: ${TABLES.length}`);
  console.log(`   📝 Enregistrements: ${totalRecords}`);
  console.log(`   💾 Taille: ${fileSize} MB`);
  console.log(`   ⏱️  Durée: ${duration}s`);

  // Nettoyer les anciens backups (garder les 30 derniers jours)
  cleanOldBackups();
}

/**
 * Supprime les backups de plus de 30 jours
 */
function cleanOldBackups() {
  const files = fs.readdirSync(BACKUP_DIR);
  const now = Date.now();
  const retentionDays = 30;
  const retentionMs = retentionDays * 24 * 60 * 60 * 1000;

  let deletedCount = 0;

  files.forEach(file => {
    if (file.startsWith('backup-supabase-') && file.endsWith('.json')) {
      const filepath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filepath);
      const age = now - stats.mtimeMs;

      if (age > retentionMs) {
        fs.unlinkSync(filepath);
        deletedCount++;
      }
    }
  });

  if (deletedCount > 0) {
    console.log(`\n🗑️  ${deletedCount} ancien(s) backup(s) supprimé(s) (> ${retentionDays} jours)`);
  }
}

// Exécuter la sauvegarde
performBackup().catch(err => {
  console.error('❌ Erreur fatale:', err);
  process.exit(1);
});
