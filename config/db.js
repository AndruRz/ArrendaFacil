const mysql = require('mysql2/promise'); // Usamos mysql2/promise para soporte de async/await

// Configuración del pool de conexiones a la base de datos
const pool = mysql.createPool({
  host: process.env.DB_HOST || '',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Verificar la conexión al pool
pool.getConnection()
  .then(conn => {
    console.log('Conectado a la base de datos MySQL en la nube');
    conn.release(); // Liberar la conexión
  })
  .catch(err => {
    console.error('Error al conectar a la base de datos:', err);
    throw err;
  });

module.exports = pool;
