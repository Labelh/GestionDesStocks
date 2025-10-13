const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuration du pool de connexions MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test de la connexion
pool.getConnection()
  .then(connection => {
    console.log('✅ Connexion à la base de données MySQL réussie');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Erreur de connexion à la base de données:', err.message);
    process.exit(1);
  });

module.exports = pool;
