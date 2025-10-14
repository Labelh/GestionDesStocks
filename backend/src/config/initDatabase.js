import db from './database.js';
import bcrypt from 'bcryptjs';

console.log('Initialisation de la base de données...');

// Créer les tables
db.exec(`
  -- Table des utilisateurs
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'manager')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Table des catégories
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Table des unités
  CREATE TABLE IF NOT EXISTS units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    abbreviation TEXT UNIQUE NOT NULL,
    is_default BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Table des zones de stockage
  CREATE TABLE IF NOT EXISTS storage_zones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Table des produits
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reference TEXT UNIQUE NOT NULL,
    designation TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    storage_zone_id INTEGER,
    shelf INTEGER,
    position INTEGER,
    location TEXT NOT NULL,
    current_stock REAL NOT NULL DEFAULT 0,
    min_stock REAL NOT NULL DEFAULT 0,
    max_stock REAL NOT NULL DEFAULT 0,
    unit_id INTEGER NOT NULL,
    photo TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (storage_zone_id) REFERENCES storage_zones(id),
    FOREIGN KEY (unit_id) REFERENCES units(id)
  );

  -- Table des demandes de sortie
  CREATE TABLE IF NOT EXISTS exit_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    product_reference TEXT NOT NULL,
    product_designation TEXT NOT NULL,
    quantity REAL NOT NULL,
    requested_by INTEGER NOT NULL,
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')),
    approved_by INTEGER,
    approved_at DATETIME,
    reason TEXT,
    notes TEXT,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (requested_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
  );

  -- Table des mouvements de stock
  CREATE TABLE IF NOT EXISTS stock_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    product_reference TEXT NOT NULL,
    product_designation TEXT NOT NULL,
    movement_type TEXT NOT NULL CHECK(movement_type IN ('entry', 'exit', 'adjustment', 'initial')),
    quantity REAL NOT NULL,
    previous_stock REAL NOT NULL,
    new_stock REAL NOT NULL,
    user_id INTEGER NOT NULL,
    user_name TEXT NOT NULL,
    reason TEXT NOT NULL,
    notes TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- Index pour améliorer les performances
  CREATE INDEX IF NOT EXISTS idx_products_reference ON products(reference);
  CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
  CREATE INDEX IF NOT EXISTS idx_exit_requests_status ON exit_requests(status);
  CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
  CREATE INDEX IF NOT EXISTS idx_stock_movements_timestamp ON stock_movements(timestamp);
`);

console.log('Tables créées avec succès!');

// Insérer les données par défaut
try {
  // Utilisateurs par défaut
  const hashedAdminPassword = bcrypt.hashSync('admin', 10);
  const hashedUserPassword = bcrypt.hashSync('user', 10);

  const insertUser = db.prepare('INSERT OR IGNORE INTO users (username, password, name, role) VALUES (?, ?, ?, ?)');
  insertUser.run('admin', hashedAdminPassword, 'Gestionnaire', 'manager');
  insertUser.run('user', hashedUserPassword, 'Utilisateur', 'user');
  console.log('Utilisateurs par défaut créés');

  // Catégories par défaut
  const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)');
  insertCategory.run('Électronique', 'Composants électroniques');
  insertCategory.run('Mécanique', 'Pièces mécaniques');
  insertCategory.run('Consommables', 'Produits consommables');
  console.log('Catégories par défaut créées');

  // Unités par défaut
  const insertUnit = db.prepare('INSERT OR IGNORE INTO units (name, abbreviation, is_default) VALUES (?, ?, ?)');
  insertUnit.run('Pièce', 'pcs', 1);
  insertUnit.run('Kilogramme', 'kg', 0);
  insertUnit.run('Litre', 'L', 0);
  insertUnit.run('Mètre', 'm', 0);
  insertUnit.run('Unité unique', 'unité', 0);
  console.log('Unités par défaut créées');

  // Zones de stockage par défaut
  const insertZone = db.prepare('INSERT OR IGNORE INTO storage_zones (name, description) VALUES (?, ?)');
  insertZone.run('Zone A', 'Entrepôt principal');
  insertZone.run('Zone B', 'Stockage secondaire');
  insertZone.run('Zone C', 'Réserve');
  console.log('Zones de stockage par défaut créées');

  console.log('\n✅ Base de données initialisée avec succès!');
  console.log('\nConnexion par défaut:');
  console.log('  Gestionnaire -> username: admin, password: admin');
  console.log('  Utilisateur  -> username: user, password: user\n');

} catch (error) {
  console.error('Erreur lors de l\'insertion des données par défaut:', error);
}

db.close();
