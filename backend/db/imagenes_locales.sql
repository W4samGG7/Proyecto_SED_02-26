-- =====================================================================
-- Migracion: fotos de los productos de ejemplo guardadas en el proyecto
--
-- Antes las fotos de ejemplo eran enlaces a Pinterest. Ahora estan en
-- frontend/assets/images/productos/ y la base apunta a esos archivos.
-- Solo cambia los productos que todavia tienen el enlace viejo (no borra datos).
-- Si la base se crea desde cero con tienda_ropa.sql no hace falta.
-- Ejecutar una sola vez:  mysql -u root -p tienda_ropa < imagenes_locales.sql
-- =====================================================================

USE tienda_ropa;

UPDATE productos SET imagen_url='/assets/images/productos/jeans-clasico-claro.jpg' WHERE imagen_url='https://i.pinimg.com/1200x/98/8e/fd/988efddbfefb91849049be49a4d4af01.jpg';
UPDATE productos SET imagen_url='/assets/images/productos/vestido-cuadros-celeste.jpg' WHERE imagen_url='https://i.pinimg.com/736x/3d/34/3c/3d343ccc1890602f7234f75a51f05604.jpg';
UPDATE productos SET imagen_url='/assets/images/productos/blusa-botones-marron.jpg' WHERE imagen_url='https://i.pinimg.com/1200x/0c/e0/06/0ce00642532b40cddf4ac7de6c026327.jpg';
UPDATE productos SET imagen_url='/assets/images/productos/jeans-negro-recto.jpg' WHERE imagen_url='https://i.pinimg.com/1200x/93/aa/21/93aa214ee6b311feb8a4cbf0c88973e6.jpg';
UPDATE productos SET imagen_url='/assets/images/productos/sudadera-gris-azul.jpg' WHERE imagen_url='https://i.pinimg.com/736x/6d/55/98/6d5598358bba26f5a90d1b61c8b3d6d4.jpg';
UPDATE productos SET imagen_url='/assets/images/productos/sudadera-gris.jpg' WHERE imagen_url='https://i.pinimg.com/736x/62/8e/74/628e744e704e2c90039ce0cfeb862e45.jpg';
UPDATE productos SET imagen_url='/assets/images/productos/pantalon-chino-beige.jpg' WHERE imagen_url='https://i.pinimg.com/736x/ed/f4/50/edf45090b6f35ed1e1462cc6247b5dc2.jpg';
UPDATE productos SET imagen_url='/assets/images/productos/pants-gris-oscuro.jpg' WHERE imagen_url='https://i.pinimg.com/1200x/cb/43/c4/cb43c4548e33ef987c7e7a2699dd64a1.jpg';
