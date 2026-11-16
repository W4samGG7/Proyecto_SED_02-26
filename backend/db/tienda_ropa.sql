-- =====================================================================
-- Proyecto-SED 
--
-- ATENCION: borra y vuelve a crear las 6 tablas (se pierden sus datos).
-- Se puede ejecutar todas las veces que haga falta.
-- Ejecutar:  mysql -u root -p < schema.sql
-- =====================================================================

SET NAMES utf8mb4;
-- drop database tienda_ropa
CREATE DATABASE IF NOT EXISTS tienda_ropa
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tienda_ropa;

-- Se borra en orden inverso a las dependencias para que no estorben las llaves foraneas
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS detalle_pedidos;
DROP TABLE IF EXISTS pedidos;
DROP TABLE IF EXISTS carrito;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS categorias;
DROP TABLE IF EXISTS usuarios;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- 1. USUARIOS: viene del formulario de registro
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre          VARCHAR(50)  NOT NULL,
  apellido        VARCHAR(50)  NOT NULL,
  correo          VARCHAR(100) NOT NULL,
  contrasena_hash VARCHAR(255) NOT NULL,
  creado_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_correo (correo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. CATEGORIAS: entradas del menu de la pagina principal
-- ---------------------------------------------------------------------
CREATE TABLE categorias (
  id     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(60) NOT NULL,
  slug   VARCHAR(60) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categorias_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. PRODUCTOS: viene del formulario de publicar articulo
-- ---------------------------------------------------------------------
CREATE TABLE productos (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre      VARCHAR(100) NOT NULL,
  marca       VARCHAR(50)  NOT NULL,
  tipo        VARCHAR(30)  NOT NULL,
  condicion   ENUM('nuevo','usado-como-nuevo','usado-buen-estado') NOT NULL,
  talla       VARCHAR(10)  NOT NULL,
  precio      DECIMAL(8,2) NOT NULL,
  cantidad    INT UNSIGNED NOT NULL DEFAULT 1,
  descripcion TEXT NULL,
  imagen_url  VARCHAR(255) NULL,
  seccion     ENUM('mujer','hombre','infantil','unisex') NOT NULL,
  activo      TINYINT(1) NOT NULL DEFAULT 1,
  vendedor_id INT UNSIGNED NULL,
  creado_en   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_productos_seccion_activo (seccion, activo),
  KEY idx_productos_vendedor (vendedor_id),
  CONSTRAINT chk_productos_precio CHECK (precio > 0),
  CONSTRAINT fk_productos_vendedor
    FOREIGN KEY (vendedor_id) REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. CARRITO: una prenda por usuario, si la repite se suma la cantidad
-- ---------------------------------------------------------------------
CREATE TABLE carrito (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id  INT UNSIGNED NOT NULL,
  producto_id INT UNSIGNED NOT NULL,
  cantidad    INT UNSIGNED NOT NULL DEFAULT 1,
  agregado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_carrito_usuario_producto (usuario_id, producto_id),
  KEY idx_carrito_producto (producto_id),
  CONSTRAINT fk_carrito_usuario
    FOREIGN KEY (usuario_id)  REFERENCES usuarios (id)  ON DELETE CASCADE,
  CONSTRAINT fk_carrito_producto
    FOREIGN KEY (producto_id) REFERENCES productos (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. PEDIDOS: compras realizadas
-- ---------------------------------------------------------------------
CREATE TABLE pedidos (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  comprador_id    INT UNSIGNED NULL,
  estado          ENUM('pendiente','pagado','enviado','entregado','cancelado')
                  NOT NULL DEFAULT 'pendiente',
  total           DECIMAL(10,2) NOT NULL,
  direccion_envio VARCHAR(255) NOT NULL,
  creado_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pedidos_comprador (comprador_id),
  CONSTRAINT fk_pedidos_comprador
    FOREIGN KEY (comprador_id) REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. DETALLE_PEDIDOS: prendas de cada pedido
--    nombre_producto y precio_unitario guardan lo que valia al comprar,
--    asi el historial no cambia si luego se edita o borra la prenda.
-- ---------------------------------------------------------------------
CREATE TABLE detalle_pedidos (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  pedido_id       INT UNSIGNED NOT NULL,
  producto_id     INT UNSIGNED NULL,
  vendedor_id     INT UNSIGNED NULL,
  nombre_producto VARCHAR(100) NOT NULL,
  cantidad        INT UNSIGNED NOT NULL,
  precio_unitario DECIMAL(8,2) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_detalle_pedido (pedido_id),
  KEY idx_detalle_producto (producto_id),
  KEY idx_detalle_vendedor (vendedor_id),
  CONSTRAINT fk_detalle_pedido
    FOREIGN KEY (pedido_id)   REFERENCES pedidos (id)   ON DELETE CASCADE,
  CONSTRAINT fk_detalle_producto
    FOREIGN KEY (producto_id) REFERENCES productos (id) ON DELETE SET NULL,
  CONSTRAINT fk_detalle_vendedor
    FOREIGN KEY (vendedor_id) REFERENCES usuarios (id)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- DATOS DE EJEMPLO
-- ---------------------------------------------------------------------
INSERT INTO categorias (nombre, slug) VALUES
  ('Novedades','novedades'), ('Mujer','mujer'), ('Hombre','hombre'),
  ('Infantil','infantil'), ('Zapatos','zapatos'), ('Accesorios','accesorios'),
  ('Bolsos','bolsos');

INSERT INTO productos (nombre, marca, tipo, condicion, talla, precio, cantidad, seccion, imagen_url) VALUES
  ('Jeans clásico claro', 'Levi''s', 'jeans', 'usado-buen-estado', '12', 16.00, 1, 'mujer',
   'https://i.pinimg.com/1200x/98/8e/fd/988efddbfefb91849049be49a4d4af01.jpg'),
  ('Vestido a cuadros de manga corta celeste', 'Zara', 'vestidos', 'usado-buen-estado', 'S', 5.50, 1, 'mujer',
   'https://i.pinimg.com/736x/3d/34/3c/3d343ccc1890602f7234f75a51f05604.jpg'),
  ('Blusa de botones formal marrón', 'Mango', 'blusas', 'usado-como-nuevo', 'L', 4.00, 1, 'mujer',
   'https://i.pinimg.com/1200x/0c/e0/06/0ce00642532b40cddf4ac7de6c026327.jpg'),
  ('Jeans negro recto', 'H&M', 'jeans', 'usado-buen-estado', '18', 10.00, 1, 'mujer',
   'https://i.pinimg.com/1200x/93/aa/21/93aa214ee6b311feb8a4cbf0c88973e6.jpg'),
  ('Sudadera oversize gris y azul', 'Tommy Hilfiger', 'sudaderas', 'usado-buen-estado', 'L', 18.00, 1, 'hombre',
   'https://i.pinimg.com/736x/6d/55/98/6d5598358bba26f5a90d1b61c8b3d6d4.jpg'),
  ('Sudadera oversize gris', 'Nike', 'sudaderas', 'usado-como-nuevo', 'XL', 12.00, 1, 'hombre',
   'https://i.pinimg.com/736x/62/8e/74/628e744e704e2c90039ce0cfeb862e45.jpg'),
  ('Pantalón chino beige', 'Dockers', 'pantalones', 'usado-buen-estado', '32', 14.00, 1, 'hombre',
   'https://i.pinimg.com/736x/ed/f4/50/edf45090b6f35ed1e1462cc6247b5dc2.jpg'),
  ('Pants oversize gris oscuro', 'Adidas', 'pantalones', 'usado-buen-estado', 'M', 10.00, 1, 'hombre',
   'https://i.pinimg.com/1200x/cb/43/c4/cb43c4548e33ef987c7e7a2699dd64a1.jpg');
   
   