require('dotenv').config();
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const { pool, probarConexion } = require('./config/database'); 

const app = express();

app.use(express.json());

// CONFIGURACIÓN DE SESIONES
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false, // Para desarrollo local con HTTP
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

const { requireLoginPage } = require('./middleware/auth');

app.use((req, res, next) => {
    let requested;
    try {
        requested = path.posix.normalize(
            decodeURIComponent(req.path).replace(/\\/g, '/')
        ).toLowerCase();
    } catch {
        return res.status(400).end();
    }

    if (requested.startsWith('/modules/seller')) {
        return requireLoginPage(req, res, next);
    }
    next();
});


//SERVIR ARCHIVOS DEL FRONTEND
app.use(express.static(
    path.join(__dirname, '../frontend')
));

//RUTAS API
const productosRoutes = require('./routes/productos');

app.use('/api/productos', productosRoutes);

//REGISTRO DE USUARIO
app.post("/api/register", async (req, res) => {

    try {

        const { nombre, apellido, email, password } = req.body;

        if([nombre,apellido,email,password].some(
            (value) => typeof value !== 'string' || value.trim() === ''
        )) {
            return res.status(400).json({
                message: "Todos los campos son obligatorios."
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

        if (!emailRegex.test(email.trim())) {
            return res.status(400).json({message: 'Ingresa un correo válido.'});
        }

        if (password.length < 8 || password.length > 72) {
            return res.status(400).json({
                message: 'La contraseña debe tener 8 y 72 caracteres.'
            });
        }


        const correo = email.trim().toLowerCase();

        // Comprobar si el correo ya existe
        const [usuarios] = await pool.execute(
            "SELECT id FROM usuarios WHERE correo = ?",
            [correo]
        );

        if (usuarios.length > 0) {
            return res.status(409).json({
                message: "Este correo ya está registrado."
            });
        }

        // Generar hash de la contraseña
        const passwordHash = await bcrypt.hash(password, 12);

        // Insertar usuario en MySQL
        await pool.execute(
            `INSERT INTO usuarios
            (nombre, apellido, correo, contrasena_hash)
            VALUES (?, ?, ?, ?)`,
            [
                nombre.trim(),
                apellido.trim(),
                correo,
                passwordHash
            ]
        );

        return res.status(201).json({
            message: "Usuario registrado correctamente."
        });

    } catch (error) {

        console.error("Error en registro:", error);

        return res.status(500).json({
            message: "Error interno al registrar el usuario."
        });

    }

});


// INICIO DE SESIÓN
app.post("/api/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Ingresa tu correo y contraseña."
            });
        }

        const correo = email.trim().toLowerCase();

        // Buscar usuario por correo
        const [usuarios] = await pool.execute(
            "SELECT * FROM usuarios WHERE correo = ?",
            [correo]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                message: "El correo o la contraseña son incorrectos."
            });
        }

        const usuario = usuarios[0];

        // Comparar contraseña con el hash almacenado
        const passwordCorrecta = await bcrypt.compare(
            password,
            usuario.contrasena_hash
        );

        if (!passwordCorrecta) {
            return res.status(401).json({
                message: "El correo o la contraseña son incorrectos."
            });
        }

        // Crear sesión
        req.session.userId = usuario.id;

        return res.status(200).json({
            message: "Inicio de sesión exitoso.",
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                email: usuario.correo
            }
        });

    } catch (error) {

        console.error("Error en login:", error);

        return res.status(500).json({
            message: "Error interno al iniciar sesión."
        });

    }

});


//COMPROBAR SESIÓN
app.get("/api/session", async (req, res) => {

    try {

        if (!req.session.userId) {
            return res.status(401).json({
                message: "No hay una sesión activa."
            });
        }

        const [usuarios] = await pool.execute(
        `SELECT id, nombre, apellido, correo
        FROM usuarios WHERE id = ?`,
        [req.session.userId]
);

        if (usuarios.length === 0) {
            return res.status(401).json({
                message: "Usuario no encontrado."
            });
        }

        return res.json({
            autenticado: true,
            usuario: usuarios[0]
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            message: "Error al consultar la sesión."
        });

    }

});

//CIERRE DE SESION
app.post("/api/logout", (req, res) => {

    req.session.destroy((error) => {

        if (error) {
            return res.status(500).json({
                message: "No se pudo cerrar la sesión."
            });
        }

        res.clearCookie("connect.sid");

        return res.json({
            message: "Sesión cerrada correctamente."
        });

    });

});

//VERIFICAR ESTADO API
app.get('/api/estado', (req, res) => {
    res.json({ mensaje: 'API funcionando correctamente' });
});

//RUTA PRINCIPAL
app.get('/', (req, res) => {
    res.sendFile(
        path.join(__dirname, '../frontend/index.html')
    );
});

//INICIAR SERVIDOR
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor funcionando en http://localhost:${PORT}`);
});
