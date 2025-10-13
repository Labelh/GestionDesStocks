const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// POST - Connexion
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis' });
    }

    // Rechercher l'utilisateur
    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);

    if (users.length === 0) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const user = users[0];

    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    // Générer un token JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name
      }
    });

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// POST - Inscription (optionnel - seulement pour créer de nouveaux utilisateurs)
router.post('/register', async (req, res) => {
  try {
    const { username, password, role, name } = req.body;

    if (!username || !password || !role || !name) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    // Vérifier si l'utilisateur existe déjà
    const [existingUsers] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);

    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'Cet utilisateur existe déjà' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const [result] = await pool.query(
      'INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, role, name]
    );

    res.status(201).json({
      id: result.insertId,
      message: 'Utilisateur créé avec succès'
    });

  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
});

// Middleware pour vérifier le token JWT
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(403).json({ error: 'Token manquant' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalide' });
  }
};

// GET - Vérifier le token et récupérer les infos utilisateur
router.get('/me', verifyToken, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, role, name FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'utilisateur' });
  }
});

module.exports = { router, verifyToken };
