// Convierte en administrador a un usuario que ya se registro
// Uso: npm run crear-admin -- correo@ejemplo.com

const { pool } = require('../config/database');

async function crearAdmin() {

    const correo = (process.argv[2] || '').trim().toLowerCase();

    if (!correo) {
        console.error('Indica el correo: npm run crear-admin -- correo@ejemplo.com');
        process.exitCode = 1;
        return;
    }

    try {

        const [resultado] = await pool.execute(
            "UPDATE usuarios SET rol = 'admin', activo = 1 WHERE correo = ?",
            [correo]
        );

        if (resultado.affectedRows === 0) {
            console.error(`No existe un usuario con el correo ${correo}. Registrate primero.`);
            process.exitCode = 1;
            return;
        }

        console.log(`${correo} ahora es administrador.`);

    } catch (error) {

        console.error('No se pudo asignar el rol:', error.message);
        process.exitCode = 1;

    } finally {

        await pool.end();

    }
}

crearAdmin();
