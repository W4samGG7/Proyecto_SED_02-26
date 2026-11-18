const { pool } = require('../config/database');

// Busca en la BD al usuario de la sesion. Se consulta en cada peticion
// para que un cambio de rol o una desactivacion se apliquen de inmediato.
async function obtenerUsuarioSesion(req) {
    if (!req.session.userId) return null;

    const [usuarios] = await pool.execute(
        'SELECT id, rol, activo FROM usuarios WHERE id = ?',
        [req.session.userId]
    );

    const usuario = usuarios[0];

    if (!usuario || !usuario.activo) {
        // Usuario borrado o desactivado: se cierra su sesion
        await new Promise((resolve) => req.session.destroy(resolve));
        return null;
    }

    return usuario;
}

function redirigirLogin(req, res) {
    const redirect = encodeURIComponent(req.originalUrl);
    res.redirect(`/modules/login/index_login.html?redirect=${redirect}`);
}

async function requireLogin(req, res, next) {
    try {
        const usuario = await obtenerUsuarioSesion(req);
        if (!usuario) {
            return res.status(401).json({ message: 'Debes iniciar sesion' });
        }
        req.usuario = usuario;
        next();
    } catch (error) {
        next(error);
    }
}

// Paginas de comprador/vendedor: el admin es solo administrativo y va a su panel
async function requireLoginPage(req, res, next) {
    try {
        const usuario = await obtenerUsuarioSesion(req);
        if (!usuario) return redirigirLogin(req, res);
        if (usuario.rol === 'admin') return res.redirect('/modules/admin/panel.html');
        req.usuario = usuario;
        next();
    } catch (error) {
        next(error);
    }
}

// Para las rutas de comprar o vender (carrito, pedidos, publicar productos)
async function requireCliente(req, res, next) {
    try {
        const usuario = await obtenerUsuarioSesion(req);
        if (!usuario) {
            return res.status(401).json({ message: 'Debes iniciar sesion' });
        }
        if (usuario.rol === 'admin') {
            return res.status(403).json({ message: 'Las cuentas de administrador no pueden comprar ni vender' });
        }
        req.usuario = usuario;
        next();
    } catch (error) {
        next(error);
    }
}

async function requireAdmin(req, res, next) {
    try {
        const usuario = await obtenerUsuarioSesion(req);
        if (!usuario) {
            return res.status(401).json({ message: 'Debes iniciar sesion' });
        }
        if (usuario.rol !== 'admin') {
            return res.status(403).json({ message: 'No tienes permisos de administrador' });
        }
        req.usuario = usuario;
        next();
    } catch (error) {
        next(error);
    }
}

async function requireAdminPage(req, res, next) {
    try {
        const usuario = await obtenerUsuarioSesion(req);
        if (!usuario) return redirigirLogin(req, res);
        if (usuario.rol !== 'admin') return res.redirect('/');
        req.usuario = usuario;
        next();
    } catch (error) {
        next(error);
    }
}

module.exports = { requireLogin, requireLoginPage, requireCliente, requireAdmin, requireAdminPage };
