const fs = require ('fs');
const path = require('path');
const crypto = require('crypto');
const { pool } = require('../config/database');

const UPLOADS_DIR = path.join(__dirname, '../uploads');

const ALLOWED_TYPES = [
    'jeans', 'pantalones', 'camisas', 'camisetas', 'blusas', 'vestidos',
    'faldas', 'shorts', 'chaquetas', 'sueteres', 'sudaderas',
    'ropa-deportiva', 'ropa-interior', 'trajes-conjuntos', 'otros'
];
const ALLOWED_CONDITIONS = ['nuevo', 'usado-como-nuevo', 'usado-buen-estado'];
const ALLOWED_SECTIONS = ['mujer', 'hombre', 'infantil', 'zapatos', 'accesorios', 'bolsos'];


const PRODUCT_SELECT = `
    SELECT p.id, p.nombre, p.marca, p.tipo, p.condicion, p.talla, p.precio,
           p.cantidad, p.descripcion, p.imagen_url, p.seccion, p.vendedor_id,
           u.nombre AS vendedor_nombre
    FROM productos p
    LEFT JOIN usuarios u ON u.id = p.vendedor_id
`;

//Detectar si es png o jpg
function detectImageType(buffer){
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    if (buffer.length >= 8 && buffer.subarray(0, 8).equals(png)) return 'png';
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
    return null;
}

function isText(value, maxLength){
    return typeof value === 'string'
     && value.trim() !== ''
     && value.trim().length <= maxLength;
}

async function crearProducto(req, res) {
    let savedFilePath = null;

    try {
        const body = req.body

        //validaciones
         if (!isText(body.item_name, 100)) {
            return res.status(400).json({ message: 'Ingresa el nombre del artículo (máx. 100 caracteres).' });
        }
        if (!isText(body.item_brand, 50)) {
            return res.status(400).json({ message: 'Ingresa la marca (máx. 50 caracteres).' });
        }
        if (!isText(body.item_size, 10)) {
            return res.status(400).json({ message: 'Ingresa la talla (máx. 10 caracteres).' });
        }
        if (!isText(body.description, 1000)) {
            return res.status(400).json({ message: 'Ingresa la descripción (máx. 1000 caracteres).' });
        }
        if (!ALLOWED_TYPES.includes(body.item_type)) {
            return res.status(400).json({ message: 'Selecciona un tipo de artículo válido.' });
        }
        if (!ALLOWED_CONDITIONS.includes(body.item_condition)) {
            return res.status(400).json({ message: 'Selecciona una condición válida.' });
        }
        if (!ALLOWED_SECTIONS.includes(body.item_section)) {
            return res.status(400).json({ message: 'Selecciona una sección válida.' });
        }

         if (!/^\d{1,6}(\.\d{1,2})?$/.test(String(body.price)) || Number(body.price) < 0.01) {
            return res.status(400).json({ message: 'Ingresa un precio válido (mínimo 0.01).' });
        }
        
        if (!/^\d{1,4}$/.test(String(body.quantity)) || Number(body.quantity) < 1) {
            return res.status(400).json({ message: 'Ingresa una cantidad válida (mínimo 1).' });
        }
        
        if (!req.file) {
            return res.status(400).json({ message: 'Sube una foto del producto.' });
        }

        const imageType = detectImageType(req.file.buffer);
        if (!imageType) {
            return res.status(400).json({ message: 'La foto debe ser PNG o JPG.' });
        }


        //nombre aleatorio
        await fs.promises.mkdir(UPLOADS_DIR, {recursive: true});
        const fileName = `${crypto.randomUUID()}.${imageType}`;
        savedFilePath = path.join(UPLOADS_DIR, fileName);
        await fs.promises.writeFile(savedFilePath, req.file.buffer, {flag: 'wx'});

        const imageUrl = `/uploads/${fileName}`;

        const [result] = await pool.execute(
            `INSERT INTO productos
                (nombre, marca, tipo, condicion, talla, precio, cantidad,
                 descripcion, imagen_url, seccion, vendedor_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                body.item_name.trim(),
                body.item_brand.trim(),
                body.item_type,
                body.item_condition,
                body.item_size.trim(),
                Number(body.price),
                Number(body.quantity),
                body.description.trim(),
                imageUrl,
                body.item_section,
                req.session.userId 
            ]
        );

        return res.status(201).json({
            message: 'Articulo publicado correctamente.',
            id: result.insertId,
            imagen_Url: imageUrl
        });

    } catch (error) {
        console.error('Error al crear producto:', error );

        if (savedFilePath) {
            fs.promises.unlink(savedFilePath).catch(() => {});
        }

        return res.status(500).json({ message: 'Error interno al publicar el articulo.'});

    }
}

function toProduct(row){
    return{
        id: row.id,
        name: row.nombre,
        brand: row.marca,
        type: row.tipo,
        condition: row.condicion,
        size: row.talla,
        price: Number(row.precio),
        stock: row.cantidad,
        description: row.descripcion ?? '',
        images: row.imagen_url ? [row.imagen_url] : [],
        category: row.seccion,
        seller: row.vendedor_id
            ? { id: row.vendedor_id, name: row.vendedor_nombre }
            : null
    };
}

function isId(value){
    return typeof value === 'string' && /^\d{1,10}$/.test(value);
}

// Obtener todos los productos 
async function obtenerProductos(req, res) {
    try {
        const conditions = ['p.activo = 1'];
        const params = [];
        const { category, seller, exclude } = req.query;

        if (category !== undefined) {
            if (!ALLOWED_SECTIONS.includes(category)) {
                return res.status(400).json({ message: 'Categoría no válida.' });
            }
            conditions.push('p.seccion = ?');
            params.push(category);
        }

        if (seller !== undefined) {
            if (!isId(seller)) {
                return res.status(400).json({ message: 'Vendedor no válido.' });
            }
            conditions.push('p.vendedor_id = ?');
            params.push(Number(seller));
        }

        if (exclude !== undefined) {
            if (!isId(exclude)) {
                return res.status(400).json({ message: 'Producto a excluir no válido.' });
            }
            conditions.push('p.id <> ?');
            params.push(Number(exclude));
        }

        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 24, 1), 50);

        const [rows] = await pool.execute(
            `${PRODUCT_SELECT}
             WHERE ${conditions.join(' AND ')}
             ORDER BY p.creado_en DESC, p.id DESC
             LIMIT ${limit}`,
            params
        );

        return res.json(rows.map(toProduct));

    } catch (error) {
        console.error('Error al obtener productos:', error);
        return res.status(500).json({ message: 'Error al obtener los productos.' });
    }
};

async function obtenerProductoPorId(req,res) {
    try {
        if(!isId(req.params.id)){
            return res.status(400).json({message: 'Id de producto no valido.'});
        }

        const [rows] = await pool.execute(
             `${PRODUCT_SELECT} WHERE p.id = ? AND p.activo = 1`,
             [Number(req.params.id)]
        );

        if(rows.length === 0) {
            return res.status(404).json({message: 'Producto no encontrado.'});
        }

        return res.json(toProduct(rows[0]));
    } catch (error) {
        console.error('Error al obtener el producto:', error);
        return res.status(500).json({message: 'Error al obtener el producto.'});
    }
}


module.exports = {
    obtenerProductos,
    obtenerProductoPorId,
    crearProducto
};