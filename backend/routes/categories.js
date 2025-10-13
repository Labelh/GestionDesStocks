const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET - Récupérer toutes les catégories
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des catégories' });
  }
});

// POST - Créer une nouvelle catégorie
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Le nom de la catégorie est requis' });
    }

    const [result] = await pool.query(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [name, description || null]
    );

    res.status(201).json({
      id: result.insertId,
      message: 'Catégorie créée avec succès'
    });
  } catch (error) {
    console.error('Error creating category:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Cette catégorie existe déjà' });
    }
    res.status(500).json({ error: 'Erreur lors de la création de la catégorie' });
  }
});

// DELETE - Supprimer une catégorie
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Catégorie non trouvée' });
    }

    res.json({ message: 'Catégorie supprimée avec succès' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la catégorie' });
  }
});

module.exports = router;
