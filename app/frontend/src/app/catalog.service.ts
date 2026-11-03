import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../environments/environment';
import { ApiResponse, Categoria, Producto } from './models';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getCategories(): Observable<Categoria[]> {
    return this.http.get<ApiResponse<Categoria[]>>(`${this.apiUrl}/categorias`).pipe(
      map((response) => response.data),
    );
  }

  getProducts(categoryId?: number): Observable<Producto[]> {
    let params = new HttpParams();
    if (categoryId !== undefined) {
      params = params.set('categoriaId', categoryId);
    }
    return this.http.get<ApiResponse<Producto[]>>(`${this.apiUrl}/productos`, { params }).pipe(
      map((response) => response.data),
    );
  }
}
