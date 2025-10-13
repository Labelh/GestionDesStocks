const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET - Récupérer toutes les demandes
router.get('/', async (req, res) => {
  try {
    const { status, requestedBy } = req.query;
    let query = 'SELECT * FROM exit_requests';
    const params = [];

    if (status || requestedBy) {
      query += ' WHERE';
      const conditions = [];

      if (status) {
        conditions.push(' status = ?');
        params.push(status);
      }

      if (requestedBy) {
        conditions.push(' requestedBy = ?');
        params.push(requestedBy);
      }

      query += conditions.join(' AND');
    }

    query += ' ORDER BY requestedAt DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching exit requests:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des demandes' });
  }
});

// GET - Récupérer une demande par ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM exit_requests WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching exit request:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la demande' });
  }
});

// POST - Créer une nouvelle demande
router.post('/', async (req, res) => {
  try {
    const { productId, productReference, productDesignation, quantity, requestedBy, reason } = req.body;

    // Validation
    if (!productId || !productReference || !productDesignation || !quantity || !requestedBy || !reason) {
      return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' });
    }

    // Vérifier le stock disponible
    const [products] = await pool.query('SELECT currentStock FROM products WHERE id = ?', [productId]);
    if (products.length === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    if (products[0].currentStock < quantity) {
      return res.status(400).json({ error: 'Stock insuffisant' });
    }

    const [result] = await pool.query(
      `INSERT INTO exit_requests (productId, productReference, productDesignation, quantity, requestedBy, reason)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [productId, productReference, productDesignation, quantity, requestedBy, reason]
    );

    res.status(201).json({
      id: result.insertId,
      message: 'Demande créée avec succès'
    });
  } catch (error) {
    console.error('Error creating exit request:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la demande' });
  }
});

// PUT - Mettre à jour une demande (approuver/rejeter)
router.put('/:id', async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { status, approvedBy, notes } = req.body;

    if (!status || !approvedBy) {
      await connection.rollback();
      return res.status(400).json({ error: 'Le statut et l\'approbateur sont requis' });
    }

    // Récupérer la demande
    const [requests] = await connection.query('SELECT * FROM exit_requests WHERE id = ?', [id]);
    if (requests.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    const request = requests[0];

    // Si la demande est approuvée, mettre à jour le stock
    if (status === 'approved') {
      const [products] = await connection.query(
        'SELECT currentStock FROM products WHERE id = ?',
        [request.productId]
      );

      if (products.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Produit non trouvé' });
      }

      const currentStock = products[0].currentStock;
      if (currentStock < request.quantity) {
        await connection.rollback();
        return res.status(400).json({ error: 'Stock insuffisant pour approuver cette demande' });
      }

      // Déduire la quantité du stock
      await connection.query(
        'UPDATE products SET currentStock = currentStock - ? WHERE id = ?',
        [request.quantity, request.productId]
      );
    }

    // Mettre à jour la demande
    await connection.query(
      `UPDATE exit_requests SET status = ?, approvedBy = ?, approvedAt = NOW(), notes = ? WHERE id = ?`,
      [status, approvedBy, notes || null, id]
    );

    await connection.commit();
    res.json({ message: 'Demande mise à jour avec succès' });

  } catch (error) {
    await connection.rollback();
    console.error('Error updating exit request:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la demande' });
  } finally {
    connection.release();
  }
});

// DELETE - Supprimer une demande
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM exit_requests WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Demande non trouvée' });
    }

    res.json({ message: 'Demande supprimée avec succès' });
  } catch (error) {
    console.error('Error deleting exit request:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la demande' });
  }
});

module.exports = router;
