// Crea las cuentas de prueba de cada rol (ver README, seccion 4).
// Uso (desde la carpeta backend): npm run usuarios-prueba
//
// Si una cuenta ya existe, se le vuelve a poner la contrasena, el rol y se activa.
// Las contrasenas se guardan con bcrypt, igual que en el registro.
// SOLO para entornos de prueba: en produccion no se deben usar estas cuentas.

const bcrypt = require('bcrypt');
const { pool } = require('../config/database');

const USUARIOS = [
    { nombre: 'Admin',     apellido: 'Loop',   correo: 'admin@loop.test',     contrasena: 'AdminLoop2026',     rol: 'admin' },
    { nombre: 'Valeria',   apellido: 'Vende',  correo: 'vendedor@loop.test',  contrasena: 'VendedorLoop2026',  rol: 'usuario' },
    { nombre: 'Carlos',    apellido: 'Compra', correo: 'comprador@loop.test', contrasena: 'CompradorLoop2026', rol: 'usuario' }
];

async function crearUsuariosPrueba() {
    try {
        for (const u of USUARIOS) {
            const hash = await bcrypt.hash(u.contrasena, 12);

            await pool.execute(`
                INSERT INTO usuarios (nombre, apellido, correo, contrasena_hash, rol, activo)
                VALUES (?, ?, ?, ?, ?, 1)
                ON DUPLICATE KEY UPDATE
                    contrasena_hash = VALUES(contrasena_hash),
                    rol = VALUES(rol),
                    activo = 1
            `, [u.nombre, u.apellido, u.correo, hash, u.rol]);

            console.log(`Listo: ${u.correo} (${u.rol})`);
        }

        // Los productos de ejemplo no tienen vendedor: se le asignan al vendedor de prueba
        // para que tenga algo en "Gestion de stock". Los que ya tienen vendedor no se tocan.
        const [resultado] = await pool.execute(`
            UPDATE productos
            SET vendedor_id = (SELECT id FROM usuarios WHERE correo = 'vendedor@loop.test')
            WHERE vendedor_id IS NULL
        `);
        console.log(`Productos de ejemplo asignados a vendedor@loop.test: ${resultado.affectedRows}`);

    } catch (error) {
        console.error('No se pudieron crear los usuarios de prueba:', error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

crearUsuariosPrueba();
