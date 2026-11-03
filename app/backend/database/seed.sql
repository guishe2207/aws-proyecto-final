INSERT INTO categorias (nombre, descripcion)
SELECT datos.nombre, datos.descripcion
FROM (VALUES
  ('Bolsos', 'Bolsos y accesorios tejidos para el dia a dia.'),
  ('Hogar', 'Objetos funcionales para dar vida a tus espacios.'),
  ('Accesorios', 'Detalles hechos para acompanarte a diario.')
) AS datos(nombre, descripcion)
WHERE NOT EXISTS (
  SELECT 1 FROM categorias existentes WHERE existentes.nombre = datos.nombre
);

INSERT INTO productos (nombre, descripcion, precio, stock, imagen, id_categoria)
SELECT datos.nombre, datos.descripcion, datos.precio, datos.stock, datos.imagen, categorias.id_categoria
FROM (VALUES
  ('Bolso natural', 'Bolso de fibras naturales, ligero y versatil.', 89000.00, 8, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=85', 'Bolsos'),
  ('Bolso de diario', 'Diseno amplio con acabado artesanal.', 112000.00, 5, 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=85', 'Bolsos'),
  ('Vela de mesa', 'Vela decorativa para una luz calida.', 42000.00, 12, 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=85', 'Hogar'),
  ('Florero de ceramica', 'Pieza sobria para flores frescas o secas.', 68000.00, 4, 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=900&q=85', 'Hogar'),
  ('Aretes dorados', 'Un acento sencillo para todos los dias.', 36000.00, 15, 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=85', 'Accesorios'),
  ('Collar de cuentas', 'Collar ligero con cuentas de tonos naturales.', 54000.00, 7, 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=900&q=85', 'Accesorios')
) AS datos(nombre, descripcion, precio, stock, imagen, nombre_categoria)
JOIN categorias ON categorias.nombre = datos.nombre_categoria
WHERE NOT EXISTS (
  SELECT 1 FROM productos existentes WHERE existentes.nombre = datos.nombre
);
