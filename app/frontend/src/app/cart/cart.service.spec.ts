import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';
import { Producto } from '../models';

const product: Producto = { idProducto: 1, nombre: 'Producto', descripcion: null, precio: 12000, stock: 2, imagen: null, idCategoria: 1 };

describe('CartService', () => {
  beforeEach(() => { localStorage.clear(); TestBed.resetTestingModule(); });

  it('calcula totales, persiste y respeta el stock', () => {
    const cart = TestBed.inject(CartService);
    expect(cart.add(product)).toBe(true);
    expect(cart.add(product)).toBe(true);
    expect(cart.add(product)).toBe(false);
    expect(cart.totalUnits()).toBe(2);
    expect(cart.total()).toBe(24000);
    expect(JSON.parse(localStorage.getItem('tienda-carrito-v1') ?? '{}').items[0].cantidad).toBe(2);
  });

  it('revalida la cantidad cuando el stock cambia', () => {
    const cart = TestBed.inject(CartService);
    cart.add(product); cart.add(product);
    cart.reconcile([{ ...product, stock: 1 }]);
    expect(cart.items()[0].cantidad).toBe(1);
    cart.reconcile([{ ...product, stock: 0 }]);
    expect(cart.items()).toEqual([]);
  });

  it('restaura el carrito desde localStorage al recargar el servicio', () => {
    const cart = TestBed.inject(CartService);
    cart.add(product);
    TestBed.resetTestingModule();
    const reloaded = TestBed.inject(CartService);
    expect(reloaded.items()[0].producto.idProducto).toBe(product.idProducto);
    expect(reloaded.items()[0].cantidad).toBe(1);
  });
});
