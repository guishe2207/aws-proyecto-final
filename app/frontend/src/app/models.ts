export interface Categoria {
  idCategoria: number;
  nombre: string;
  descripcion: string | null;
}

export interface Producto {
  idProducto: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  stock: number;
  imagen: string | null;
  idCategoria: number;
}

export interface CategoriaEntrada {
  nombre: string;
  descripcion: string | null;
}

export interface ProductoEntrada {
  nombre: string;
  descripcion: string | null;
  precio: number;
  stock: number;
  imagen: string | null;
  idCategoria: number;
}

export interface SesionLogin {
  token: string;
  csrfToken: string;
  usuario: string;
  expiraEn: string;
}

export interface CartItem {
  producto: Producto;
  cantidad: number;
}

export interface CartState {
  items: CartItem[];
}

export interface SesionAdmin {
  idUsuario: number;
  usuario: string;
}

export interface ApiResponse<T> {
  data: T;
}

export interface PedidoCreado { idPedido: number; total: number; duplicado: boolean; }

export interface PedidoResumen { idPedido: number; nombreCliente: string; correo: string; total: number; estado: string; fechaCreacion: string; }
export interface DetallePedido { idDetalle: number; idProducto: number; nombreProducto: string; cantidad: number; precioUnitario: number; subtotal: number; }
export interface PedidoDetalle extends PedidoResumen { telefono: string; direccion: string; ciudad: string; departamento: string; observaciones: string | null; detalles: DetallePedido[]; }
