const mysql = require('mysql2/promise');

require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Probar conexión con MySQL
async function probarConexion() {
    let connection;

    try {
        connection = await pool.getConnection();

        console.log('Conexion exitosa con MySQL');
        console.log('Base de datos:', process.env.DB_NAME);

    } catch (error) {
        console.error('Error de conexion MySQL:', error.message);
        throw error;

    } finally {
        if (connection) {
            connection.release();
        }
    }
}

module.exports = {
    pool,
    probarConexion
};
