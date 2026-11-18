-- =====================================================================
-- Migracion: agrega rol y estado a los usuarios
--
-- Solo para bases que ya existian antes de este cambio (no borra datos).
-- Si la base se crea desde cero con tienda_ropa.sql no hace falta.
-- Ejecutar una sola vez:  mysql -u root -p tienda_ropa < migracion_roles.sql
-- =====================================================================

USE tienda_ropa;

ALTER TABLE usuarios
  ADD COLUMN rol    ENUM('usuario','admin') NOT NULL DEFAULT 'usuario' AFTER contrasena_hash,
  ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1 AFTER rol;
