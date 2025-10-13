-- Base de données pour Gestion des Stocks
-- Exécutez ce fichier dans votre MySQL pour créer la structure

CREATE DATABASE IF NOT EXISTS gestion_stocks CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gestion_stocks;

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'manager') NOT NULL,
  name VARCHAR(255) NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des catégories
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des unités
CREATE TABLE IF NOT EXISTS units (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  abbreviation VARCHAR(20) NOT NULL,
  isDefault BOOLEAN DEFAULT FALSE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_abbreviation (abbreviation)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des produits
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reference VARCHAR(100) NOT NULL UNIQUE,
  designation VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  location VARCHAR(255) NOT NULL,
  currentStock DECIMAL(10, 2) NOT NULL DEFAULT 0,
  minStock DECIMAL(10, 2) NOT NULL DEFAULT 0,
  maxStock DECIMAL(10, 2) NOT NULL DEFAULT 0,
  unit VARCHAR(50) NOT NULL,
  photo LONGTEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_reference (reference),
  INDEX idx_category (category),
  INDEX idx_stock (currentStock, minStock)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des demandes de sortie
CREATE TABLE IF NOT EXISTS exit_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  productId INT NOT NULL,
  productReference VARCHAR(100) NOT NULL,
  productDesignation VARCHAR(255) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  requestedBy VARCHAR(100) NOT NULL,
  requestedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  approvedBy VARCHAR(100),
  approvedAt DATETIME,
  reason TEXT,
  notes TEXT,
  FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_requested_by (requestedBy),
  INDEX idx_product (productId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insérer les données par défaut

-- Utilisateurs par défaut (mot de passe hashé pour 'admin' et 'user')
-- Note: Les mots de passe seront hashés par bcrypt dans l'application
INSERT INTO users (username, password, role, name) VALUES
('admin', '$2b$10$rKvvJZXVQxhb3LU.RYJSFOxgKK1JZ4Y5fZGx0lQH7V5dHPj3z9N2m', 'manager', 'Gestionnaire'),
('user', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'Utilisateur')
ON DUPLICATE KEY UPDATE username=username;

-- Catégories par défaut
INSERT INTO categories (name, description) VALUES
('Électronique', 'Composants et équipements électroniques'),
('Mécanique', 'Pièces et outils mécaniques'),
('Consommables', 'Produits consommables et fournitures'),
('Informatique', 'Matériel et accessoires informatiques'),
('Outillage', 'Outils et équipements divers')
ON DUPLICATE KEY UPDATE name=name;

-- Unités par défaut
INSERT INTO units (name, abbreviation, isDefault) VALUES
('Pièce', 'pcs', TRUE),
('Kilogramme', 'kg', FALSE),
('Litre', 'L', FALSE),
('Mètre', 'm', FALSE),
('Unité unique', 'unité', FALSE),
('Boîte', 'box', FALSE),
('Carton', 'ctn', FALSE)
ON DUPLICATE KEY UPDATE name=name;

-- Produits d'exemple (optionnel - commentez si vous ne voulez pas de données de test)
INSERT INTO products (reference, designation, category, location, currentStock, minStock, maxStock, unit) VALUES
('ELEC-001', 'Résistance 10K Ohm', 'Électronique', 'Étagère A1', 500, 100, 1000, 'pcs'),
('MECA-001', 'Vis M6x20', 'Mécanique', 'Étagère B2', 200, 50, 500, 'pcs'),
('CONS-001', 'Papier A4', 'Consommables', 'Étagère C3', 15, 10, 50, 'box'),
('INFO-001', 'Câble USB-C', 'Informatique', 'Étagère D1', 30, 10, 100, 'pcs')
ON DUPLICATE KEY UPDATE reference=reference;
