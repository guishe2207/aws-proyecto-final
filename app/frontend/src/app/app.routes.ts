import { Routes } from '@angular/router';
import { App } from './app';
import { adminGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', component: App },
  { path: 'carrito', loadComponent: () => import('./cart/cart').then((module) => module.Cart) },
  { path: 'checkout', loadComponent: () => import('./checkout/checkout').then((module) => module.Checkout) },
  { path: 'compra-confirmada', loadComponent: () => import('./checkout/confirmation').then((module) => module.PurchaseConfirmation) },
  {
    path: 'admin/login',
    loadComponent: () => import('./admin/admin-login').then((module) => module.AdminLogin),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin/admin-panel').then((module) => module.AdminPanel),
  },
  { path: '**', redirectTo: '' },
];
