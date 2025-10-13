const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET - Récupérer tous les produits
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY createdAt DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des produits' });
  }
});

// GET - Récupérer un produit par ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du produit' });
  }
});

// POST - Créer un nouveau produit
router.post('/', async (req, res) => {
  try {
    const { reference, designation, category, location, currentStock, minStock, maxStock, unit, photo } = req.body;

    // Validation
    if (!reference || !designation || !category || !location || !unit) {
      return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' });
    }

    const [result] = await pool.query(
      `INSERT INTO products (reference, designation, category, location, currentStock, minStock, maxStock, unit, photo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [reference, designation, category, location, currentStock || 0, minStock || 0, maxStock || 0, unit, photo || null]
    );

    res.status(201).json({
      id: result.insertId,
      message: 'Produit créé avec succès'
    });
  } catch (error) {
    console.error('Error creating product:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Cette référence existe déjà' });
    }
    res.status(500).json({ error: 'Erreur lors de la création du produit' });
  }
});

// PUT - Mettre à jour un produit
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Construire la requête dynamiquement
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && key !== 'createdAt') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Aucune donnée à mettre à jour' });
    }

    values.push(id);

    const [result] = await pool.query(
      `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    res.json({ message: 'Produit mis à jour avec succès' });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du produit' });
  }
});

// DELETE - Supprimer un produit
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    res.json({ message: 'Produit supprimé avec succès' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du produit' });
  }
});

// GET - Obtenir les alertes de stock
router.get('/alerts/low-stock', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM products WHERE currentStock <= minStock ORDER BY currentStock ASC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des alertes' });
  }
});

module.exports = router;
