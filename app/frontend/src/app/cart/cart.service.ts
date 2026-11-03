import { Injectable, computed, signal } from '@angular/core';
import { CartItem, CartState, Producto } from '../models';

const STORAGE_KEY = 'tienda-carrito-v1';

function readCart(): CartState {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{"items":[]}') as CartState;
    if (!Array.isArray(parsed.items)) return { items: [] };
    return { items: parsed.items.filter((item) => item?.producto && Number.isInteger(item.cantidad) && item.cantidad > 0) };
  } catch { return { items: [] }; }
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly stateSignal = signal<CartState>(readCart());
  readonly items = computed(() => this.stateSignal().items);
  readonly totalUnits = computed(() => this.items().reduce((total, item) => total + item.cantidad, 0));
  readonly total = computed(() => this.items().reduce((total, item) => total + item.producto.precio * item.cantidad, 0));

  add(producto: Producto): boolean {
    if (producto.stock < 1) return false;
    const current = this.items().find((item) => item.producto.idProducto === producto.idProducto);
    return this.update(producto, (current?.cantidad ?? 0) + 1);
  }
  setQuantity(producto: Producto, cantidad: number): boolean {
    if (!Number.isInteger(cantidad) || cantidad < 1) { this.remove(producto.idProducto); return true; }
    return this.update(producto, cantidad);
  }
  remove(idProducto: number): void { this.save(this.items().filter((item) => item.producto.idProducto !== idProducto)); }
  clear(): void { this.save([]); }
  reconcile(products: Producto[]): void {
    const byId = new Map(products.map((product) => [product.idProducto, product]));
    this.save(this.items().flatMap((item) => {
      const latest = byId.get(item.producto.idProducto);
      return !latest || latest.stock < 1 ? [] : [{ producto: latest, cantidad: Math.min(item.cantidad, latest.stock) }];
    }));
  }
  private update(producto: Producto, cantidad: number): boolean {
    if (cantidad > producto.stock) return false;
    const items = this.items();
    const exists = items.some((item) => item.producto.idProducto === producto.idProducto);
    this.save(exists ? items.map((item) => item.producto.idProducto === producto.idProducto ? { producto, cantidad } : item) : [...items, { producto, cantidad }]);
    return true;
  }
  private save(items: CartItem[]): void {
    const state = { items }; this.stateSignal.set(state);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* almacenamiento no disponible */ }
  }
}
