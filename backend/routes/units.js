const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET - Récupérer toutes les unités
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM units ORDER BY isDefault DESC, name ASC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching units:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des unités' });
  }
});

// POST - Créer une nouvelle unité
router.post('/', async (req, res) => {
  try {
    const { name, abbreviation, isDefault } = req.body;

    if (!name || !abbreviation) {
      return res.status(400).json({ error: 'Le nom et l\'abréviation sont requis' });
    }

    const [result] = await pool.query(
      'INSERT INTO units (name, abbreviation, isDefault) VALUES (?, ?, ?)',
      [name, abbreviation, isDefault || false]
    );

    res.status(201).json({
      id: result.insertId,
      message: 'Unité créée avec succès'
    });
  } catch (error) {
    console.error('Error creating unit:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'unité' });
  }
});

// DELETE - Supprimer une unité
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM units WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Unité non trouvée' });
    }

    res.json({ message: 'Unité supprimée avec succès' });
  } catch (error) {
    console.error('Error deleting unit:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'unité' });
  }
});

module.exports = router;
