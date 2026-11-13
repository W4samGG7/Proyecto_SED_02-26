const express = require('express');
const path = require('path');

const app = express();

app.use(express.json());

// Servir archivos del frontend
app.use(express.static(
    path.join(__dirname, '../frontend')
));

// Rutas de la API
const productosRoutes = require('./routes/productos');

app.use('/api/productos', productosRoutes);

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(
        path.join(__dirname, '../frontend/index.html')
    );
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor funcionando en http://localhost:${PORT}`);
});
