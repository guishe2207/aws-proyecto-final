const pool = require('../config/database');
const { AppError } = require('../middleware/errors');

function pedidoApi(row) {
  return { ...row, total: Number(row.total), detalles: row.detalles?.map((d) => ({ ...d, precioUnitario: Number(d.precioUnitario), subtotal: Number(d.subtotal) })) };
}

async function crear(datos) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const previo = await client.query('SELECT id_pedido AS "idPedido", total FROM pedidos WHERE clave_idempotencia = $1', [datos.claveIdempotencia]);
    if (previo.rowCount) { await client.query('COMMIT'); return { ...previo.rows[0], total: Number(previo.rows[0].total), duplicado: true }; }
    const cantidades = new Map();
    for (const item of datos.items) cantidades.set(item.idProducto, (cantidades.get(item.idProducto) ?? 0) + item.cantidad);
    const ids = [...cantidades.keys()].sort((a, b) => a - b);
    const products = await client.query('SELECT id_producto, nombre, precio, stock FROM productos WHERE id_producto = ANY($1::int[]) ORDER BY id_producto FOR UPDATE', [ids]);
    if (products.rowCount !== ids.length) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Uno o más productos ya no existen.');
    let total = 0;
    const details = products.rows.map((p) => {
      const cantidad = cantidades.get(p.id_producto);
      if (p.stock < cantidad) throw new AppError(409, 'INSUFFICIENT_STOCK', `No hay existencias suficientes para ${p.nombre}.`);
      const precio = Number(p.precio); const subtotal = precio * cantidad; total += subtotal;
      return { ...p, cantidad, precio, subtotal };
    });
    const order = await client.query(
      `INSERT INTO pedidos (nombre_cliente, correo, telefono, direccion, ciudad, departamento, observaciones, total, clave_idempotencia)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id_pedido AS "idPedido", total`,
      [datos.nombre, datos.correo, datos.telefono, datos.direccion, datos.ciudad, datos.departamento, datos.observaciones, total, datos.claveIdempotencia],
    );
    for (const detail of details) {
      await client.query('INSERT INTO detalle_pedido (id_pedido,id_producto,nombre_producto,cantidad,precio_unitario,subtotal) VALUES ($1,$2,$3,$4,$5,$6)', [order.rows[0].idPedido, detail.id_producto, detail.nombre, detail.cantidad, detail.precio, detail.subtotal]);
      await client.query('UPDATE productos SET stock = stock - $1 WHERE id_producto = $2', [detail.cantidad, detail.id_producto]);
    }
    await client.query('COMMIT');
    return { idPedido: order.rows[0].idPedido, total: Number(order.rows[0].total), duplicado: false };
  } catch (error) {
    await client.query('ROLLBACK');
    // Dos solicitudes idénticas simultáneas compiten por el índice UNIQUE: devolver el pedido ya creado.
    if (error.code === '23505') {
      const existing = await pool.query('SELECT id_pedido AS "idPedido", total FROM pedidos WHERE clave_idempotencia = $1', [datos.claveIdempotencia]);
      if (existing.rowCount) return { ...existing.rows[0], total: Number(existing.rows[0].total), duplicado: true };
    }
    throw error;
  } finally { client.release(); }
}

async function listar() {
  const result = await pool.query('SELECT id_pedido AS "idPedido", nombre_cliente AS "nombreCliente", correo, total, estado, fecha_creacion AS "fechaCreacion" FROM pedidos ORDER BY fecha_creacion DESC');
  return result.rows.map((p) => ({ ...p, total: Number(p.total) }));
}
async function obtener(id) {
  const pedido = await pool.query(
    'SELECT id_pedido AS "idPedido", nombre_cliente AS "nombreCliente", correo, telefono, direccion, ciudad, departamento, observaciones, total, estado, fecha_creacion AS "fechaCreacion" FROM pedidos WHERE id_pedido = $1', [id],
  );
  if (!pedido.rowCount) throw new AppError(404, 'ORDER_NOT_FOUND', 'No se encontró el pedido solicitado.');
  const details = await pool.query(
    'SELECT id_detalle AS "idDetalle", id_producto AS "idProducto", nombre_producto AS "nombreProducto", cantidad, precio_unitario AS "precioUnitario", subtotal FROM detalle_pedido WHERE id_pedido = $1 ORDER BY id_detalle', [id],
  );
  return pedidoApi({ ...pedido.rows[0], detalles: details.rows });
}
module.exports = { crear, listar, obtener, pedidoApi };
