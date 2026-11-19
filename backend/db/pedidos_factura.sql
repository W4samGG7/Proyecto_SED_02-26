-- =====================================================================
-- Migracion: la factura se arma con las tablas pedidos / detalle_pedidos.
-- Agrega marca y talla al detalle (copia de lo que valia al comprar),
-- para que la factura no cambie si luego se edita o borra la prenda.
--
-- Las filas que ya existan quedan con marca/talla en NULL (no se rompen).
-- Ejecutar una sola vez:  mysql -u root -p tienda_ropa < migracion_pedidos_factura.sql
--
-- Si la base se crea desde cero, agrega estas dos columnas tambien al
-- CREATE TABLE detalle_pedidos de tienda_ropa.sql.
-- =====================================================================

USE tienda_ropa;

ALTER TABLE detalle_pedidos
  ADD COLUMN marca VARCHAR(50) NULL AFTER nombre_producto,
  ADD COLUMN talla VARCHAR(10) NULL AFTER marca;