import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse, PedidoCreado } from '../models';
export interface PedidoEntrada { nombre: string; correo: string; telefono: string; direccion: string; ciudad: string; departamento: string; observaciones: string | null; claveIdempotencia: string; items: { idProducto: number; cantidad: number }[]; }
@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly http = inject(HttpClient);
  // Sólo conserva el resultado confirmado durante esta navegación; no expone pedidos por URL.
  readonly confirmacion = signal<PedidoCreado | null>(null);
  crearPedido(datos: PedidoEntrada): Observable<PedidoCreado> { return this.http.post<ApiResponse<PedidoCreado>>(`${environment.apiUrl}/pedidos`, datos).pipe(map((response) => response.data)); }
  guardarConfirmacion(pedido: PedidoCreado): void { this.confirmacion.set(pedido); }
  limpiarConfirmacion(): void { this.confirmacion.set(null); }
}
