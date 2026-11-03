import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const loginUrl = router.createUrlTree(['/admin/login']);

  if (!auth.isLoggedIn()) {
    return loginUrl;
  }

  return auth.verificarSesion().pipe(
    map(() => true),
    catchError(() => {
      auth.limpiarSesion();
      return of(loginUrl);
    }),
  );
};
