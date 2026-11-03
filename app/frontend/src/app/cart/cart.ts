import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartItem } from '../models';
import { CartService } from './cart.service';

@Component({ imports: [CurrencyPipe, RouterLink], selector: 'app-cart', styleUrl: './cart.scss', templateUrl: './cart.html' })
export class Cart {
  protected readonly cart = inject(CartService);
  protected readonly notice = signal('');
  protected change(item: CartItem, delta: number): void {
    if (!this.cart.setQuantity(item.producto, item.cantidad + delta)) this.notice.set(`Solo hay ${item.producto.stock} unidad(es) disponible(s).`);
    else this.notice.set('');
  }
  protected set(item: CartItem, event: Event): void {
    if (!this.cart.setQuantity(item.producto, Number((event.target as HTMLInputElement).value))) this.notice.set(`El máximo disponible es ${item.producto.stock}.`);
    else this.notice.set('');
  }
}
