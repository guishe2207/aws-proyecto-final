import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-admin-login',
  styleUrl: './admin.scss',
  templateUrl: './admin-login.html',
})
export class AdminLogin implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group({
    usuario: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });
  protected readonly enviando = signal(false);
  protected readonly error = signal('');

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.auth.verificarSesion().subscribe({
        next: () => this.router.navigateByUrl('/admin'),
        error: () => this.auth.limpiarSesion(),
      });
    }
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { usuario, password } = this.form.getRawValue();
    this.enviando.set(true);
    this.error.set('');
    this.auth.login(usuario.trim(), password).subscribe({
      next: () => this.router.navigateByUrl('/admin'),
      error: (error: HttpErrorResponse) => {
        this.enviando.set(false);
        this.error.set(this.mensajeDeError(error));
      },
    });
  }

  private mensajeDeError(error: HttpErrorResponse): string {
    if (error.status === 401) {
      return 'Usuario o contraseña incorrectos.';
    }
    if (error.status === 0) {
      return 'No se pudo conectar con la API. Comprueba que el backend esté activo.';
    }
    return 'No fue posible iniciar sesión. Intenta de nuevo.';
  }
}
