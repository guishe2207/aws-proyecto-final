import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse, SesionAdmin, SesionLogin } from '../models';

const STORAGE_KEY = 'tienda-admin-token';
const CSRF_STORAGE_KEY = 'tienda-admin-csrf';

// La sesion vive solo en esta pestana (sessionStorage): al cerrarla, hay que volver a entrar.
function leerToken(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function guardarToken(token: string | null, csrfToken: string | null = null): void {
  try {
    if (token) {
      sessionStorage.setItem(STORAGE_KEY, token);
      if (csrfToken) sessionStorage.setItem(CSRF_STORAGE_KEY, csrfToken);
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(CSRF_STORAGE_KEY);
    }
  } catch {
    // Sin almacenamiento disponible, la sesion dura solo hasta recargar la pagina.
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private readonly tokenSignal = signal<string | null>(leerToken());
  private readonly csrfSignal = signal<string | null>(typeof sessionStorage === 'undefined' ? null : sessionStorage.getItem(CSRF_STORAGE_KEY));

  readonly isLoggedIn = computed(() => this.tokenSignal() !== null);

  get token(): string | null {
    return this.tokenSignal();
  }
  get csrfToken(): string | null { return this.csrfSignal(); }

  login(usuario: string, password: string): Observable<void> {
    return this.http.post<ApiResponse<SesionLogin>>(`${this.apiUrl}/auth/login`, { usuario, password }).pipe(
      tap(({ data }) => this.guardar(data.token, data.csrfToken)),
      map(() => undefined),
    );
  }

  // Comprueba con el servidor que el token guardado sigue valido.
  verificarSesion(): Observable<SesionAdmin> {
    return this.http.get<ApiResponse<SesionAdmin>>(`${this.apiUrl}/auth/sesion`).pipe(
      map((response) => response.data),
    );
  }

  logout(): void {
    const token = this.tokenSignal();
    if (token) {
      this.http.post(`${this.apiUrl}/auth/logout`, null, {
        headers: new HttpHeaders({ Authorization: `Bearer ${token}`, 'X-CSRF-Token': this.csrfToken ?? '' }),
      }).subscribe({ error: () => undefined });
    }
    this.limpiarSesion();
  }

  limpiarSesion(): void {
    this.guardar(null);
  }

  private guardar(token: string | null, csrfToken: string | null = null): void {
    guardarToken(token, csrfToken);
    this.tokenSignal.set(token);
    this.csrfSignal.set(csrfToken);
  }
}
