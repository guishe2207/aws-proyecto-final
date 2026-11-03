import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable, forkJoin } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { CatalogService } from '../catalog.service';
import { Categoria, PedidoDetalle, PedidoResumen, Producto, ProductoEntrada } from '../models';
import { AdminService } from './admin.service';

type Pestana = 'dashboard' | 'productos' | 'categorias' | 'inventario' | 'pedidos';

const STOCK_BAJO = 5;

@Component({
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule, RouterLink],
  selector: 'app-admin-panel',
  styleUrl: './admin.scss',
  templateUrl: './admin-panel.html',
})
export class AdminPanel implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly catalog = inject(CatalogService);
  private readonly admin = inject(AdminService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly stockBajo = STOCK_BAJO;
  protected readonly pestana = signal<Pestana>('dashboard');
  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly productos = signal<Producto[]>([]);
  protected readonly pedidos = signal<PedidoResumen[]>([]);
  protected readonly pedidoSeleccionado = signal<PedidoDetalle | null>(null);
  protected readonly cargandoPedidos = signal(false);
  protected readonly cargando = signal(true);
  protected readonly mensaje = signal('');
  protected readonly error = signal('');
  protected readonly productoEditandoId = signal<number | null>(null);
  protected readonly categoriaEditandoId = signal<number | null>(null);
  protected readonly inventario = computed(() => [...this.productos()].sort((a, b) => a.stock - b.stock));
  protected readonly productosStockBajo = computed(() => this.productos().filter((p) => p.stock <= STOCK_BAJO).length);
  protected readonly productosDisponibles = computed(() => this.productos().filter((p) => p.stock > 0).length);
  protected readonly productosAgotados = computed(() => this.productos().filter((p) => p.stock === 0).length);

  protected readonly productoForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    descripcion: [''],
    precio: [0, [Validators.required, Validators.min(0.01), Validators.max(9999999999.99)]],
    stock: [0, [Validators.required, Validators.min(0), Validators.max(2147483647), Validators.pattern(/^\d+$/)]],
    imagen: [''],
    idCategoria: [0, [Validators.required, Validators.min(1)]],
  });

  protected readonly categoriaForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    descripcion: [''],
  });

  ngOnInit(): void {
    this.recargar();
  }

  protected cambiarPestana(pestana: Pestana): void {
    this.pestana.set(pestana);
    this.limpiarAvisos();
    if (pestana === 'pedidos') this.cargarPedidos();
  }

  protected verPedido(id: number): void {
    this.cargandoPedidos.set(true);
    this.admin.getPedido(id).subscribe({
      next: (pedido) => { this.pedidoSeleccionado.set(pedido); this.cargandoPedidos.set(false); },
      error: (error: HttpErrorResponse) => { this.cargandoPedidos.set(false); this.error.set(this.mensajeDeError(error)); },
    });
  }

  protected cerrarDetallePedido(): void { this.pedidoSeleccionado.set(null); }

  protected guardarProducto(): void {
    if (this.productoForm.invalid) {
      this.productoForm.markAllAsTouched();
      return;
    }

    const valores = this.productoForm.getRawValue();
    const datos: ProductoEntrada = {
      nombre: valores.nombre.trim(),
      descripcion: valores.descripcion.trim() || null,
      precio: Number(valores.precio),
      stock: Number(valores.stock),
      imagen: valores.imagen.trim() || null,
      idCategoria: Number(valores.idCategoria),
    };

    const id = this.productoEditandoId();
    const operacion = id === null ? this.admin.crearProducto(datos) : this.admin.actualizarProducto(id, datos);
    this.ejecutar(operacion, id === null ? 'Producto creado.' : 'Producto actualizado.', () => this.cancelarProducto());
  }

  protected editarProducto(producto: Producto): void {
    this.productoEditandoId.set(producto.idProducto);
    this.productoForm.reset({
      nombre: producto.nombre,
      descripcion: producto.descripcion ?? '',
      precio: producto.precio,
      stock: producto.stock,
      imagen: producto.imagen ?? '',
      idCategoria: producto.idCategoria,
    });
    this.limpiarAvisos();
  }

  protected cancelarProducto(): void {
    this.productoEditandoId.set(null);
    this.productoForm.reset({ nombre: '', descripcion: '', precio: 0, stock: 0, imagen: '', idCategoria: 0 });
  }

  protected eliminarProducto(producto: Producto): void {
    if (!confirm(`¿Eliminar el producto "${producto.nombre}"?`)) {
      return;
    }
    this.ejecutar(this.admin.eliminarProducto(producto.idProducto), 'Producto eliminado.', () => {
      if (this.productoEditandoId() === producto.idProducto) {
        this.cancelarProducto();
      }
    });
  }

  protected guardarCategoria(): void {
    if (this.categoriaForm.invalid) {
      this.categoriaForm.markAllAsTouched();
      return;
    }

    const valores = this.categoriaForm.getRawValue();
    const datos = { nombre: valores.nombre.trim(), descripcion: valores.descripcion.trim() || null };

    const id = this.categoriaEditandoId();
    const operacion = id === null ? this.admin.crearCategoria(datos) : this.admin.actualizarCategoria(id, datos);
    this.ejecutar(operacion, id === null ? 'Categoría creada.' : 'Categoría actualizada.', () => this.cancelarCategoria());
  }

  protected editarCategoria(categoria: Categoria): void {
    this.categoriaEditandoId.set(categoria.idCategoria);
    this.categoriaForm.reset({ nombre: categoria.nombre, descripcion: categoria.descripcion ?? '' });
    this.limpiarAvisos();
  }

  protected cancelarCategoria(): void {
    this.categoriaEditandoId.set(null);
    this.categoriaForm.reset({ nombre: '', descripcion: '' });
  }

  protected eliminarCategoria(categoria: Categoria): void {
    if (!confirm(`¿Eliminar la categoría "${categoria.nombre}"?`)) {
      return;
    }
    this.ejecutar(this.admin.eliminarCategoria(categoria.idCategoria), 'Categoría eliminada.', () => {
      if (this.categoriaEditandoId() === categoria.idCategoria) {
        this.cancelarCategoria();
      }
    });
  }

  protected nombreCategoria(id: number): string {
    return this.categorias().find((categoria) => categoria.idCategoria === id)?.nombre ?? 'Sin categoría';
  }

  protected cerrarSesion(): void {
    this.auth.logout();
    this.router.navigateByUrl('/admin/login');
  }

  private recargar(): void {
    this.cargando.set(true);
    forkJoin({
      categorias: this.catalog.getCategories(),
      productos: this.catalog.getProducts(),
    }).subscribe({
      next: ({ categorias, productos }) => {
        this.categorias.set(categorias);
        this.productos.set(productos);
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.cargando.set(false);
        this.error.set(this.mensajeDeError(error));
      },
    });
  }

  private cargarPedidos(): void {
    this.cargandoPedidos.set(true);
    this.pedidoSeleccionado.set(null);
    this.admin.getPedidos().subscribe({
      next: (pedidos) => { this.pedidos.set(pedidos); this.cargandoPedidos.set(false); },
      error: (error: HttpErrorResponse) => { this.cargandoPedidos.set(false); this.error.set(this.mensajeDeError(error)); },
    });
  }

  // Ejecuta una escritura, muestra el aviso, recarga los datos y limpia el formulario al terminar.
  private ejecutar<T>(operacion: Observable<T>, aviso: string, alTerminar: () => void): void {
    this.limpiarAvisos();
    operacion.subscribe({
      next: () => {
        this.mensaje.set(aviso);
        alTerminar();
        this.recargar();
      },
      error: (error: HttpErrorResponse) => this.error.set(this.mensajeDeError(error)),
    });
  }

  private limpiarAvisos(): void {
    this.mensaje.set('');
    this.error.set('');
  }

  private mensajeDeError(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'No se pudo conectar con la API.';
    }
    if (error.status === 401) {
      return 'Tu sesión expiró. Vuelve a iniciar sesión.';
    }
    return error.error?.error?.message ?? 'No fue posible completar la operación.';
  }
}
