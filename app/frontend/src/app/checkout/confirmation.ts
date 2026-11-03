import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CheckoutService } from './checkout.service';

@Component({ imports: [CurrencyPipe, RouterLink], selector: 'app-purchase-confirmation', styleUrl: './confirmation.scss', templateUrl: './confirmation.html' })
export class PurchaseConfirmation implements OnInit {
  private readonly checkout = inject(CheckoutService);
  private readonly router = inject(Router);
  protected readonly pedido = this.checkout.confirmacion;
  ngOnInit(): void { if (!this.pedido()) this.router.navigateByUrl('/'); }
  protected volver(): void { this.checkout.limpiarConfirmacion(); }
}
