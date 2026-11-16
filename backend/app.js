require('dotenv').config();

const express = require('express');

const app = express();

const productosRoutes = require('./routes/productos');

app.use(express.json());

app.use('/api/productos', productosRoutes);

app.get('/api/estado', (req, res) => {
    res.json({
        mensaje: 'API funcionando correctamente'
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en puerto ${PORT}`);
});
