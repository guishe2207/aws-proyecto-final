import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

// Anade el token a las peticiones de la API. Si el servidor responde 401 con token, la sesion ya no sirve.
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const token = auth.token;

  if (!token || !request.url.startsWith(environment.apiUrl) || request.headers.has('Authorization')) {
    return next(request);
  }

  const router = inject(Router);
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (['POST', 'PUT', 'DELETE'].includes(request.method) && auth.csrfToken) headers['X-CSRF-Token'] = auth.csrfToken;
  return next(request.clone({ setHeaders: headers })).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        auth.limpiarSesion();
        router.navigateByUrl('/admin/login');
      }
      return throwError(() => error);
    }),
  );
};
