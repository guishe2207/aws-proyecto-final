import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of, startWith, Subject, switchMap, tap, timer } from 'rxjs';
import { CatalogService } from './catalog.service';
import { CartService } from './cart/cart.service';
import { Categoria, Producto } from './models';

const SLIDE_INTERVAL_MS = 6000;

@Component({
  imports: [CurrencyPipe, RouterLink],
  selector: 'app-catalog',
  styleUrl: './catalog.scss',
  templateUrl: './catalog.html',
})
export class App implements OnInit {
  private readonly catalog = inject(CatalogService);
  protected readonly cart = inject(CartService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly categoryChanges = new Subject<number | null>();

  protected readonly categories = signal<Categoria[]>([]);
  protected readonly products = signal<Producto[]>([]);
  protected readonly selectedCategoryId = signal<number | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly categoryError = signal('');
  protected readonly fallbackImage = 'https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&w=900&q=85';
  protected readonly slides = [
    {
      image: 'https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&w=1200&q=85',
      caption: 'Hecho para quedarse',
    },
    {
      image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=85',
      caption: 'Tejido a mano',
    },
    {
      image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=1200&q=85',
      caption: 'Luz para tus espacios',
    },
  ];
  protected readonly currentSlide = signal(0);

  ngOnInit(): void {
    // Con "reducir movimiento" activado en el sistema, la portada no cambia sola.
    const reducedMotion = typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reducedMotion) {
      timer(SLIDE_INTERVAL_MS, SLIDE_INTERVAL_MS).pipe(
        takeUntilDestroyed(this.destroyRef),
      ).subscribe(() => this.currentSlide.update((index) => (index + 1) % this.slides.length));
    }

    this.categoryChanges.pipe(
      startWith(null),
      tap(() => {
        this.loading.set(true);
        this.error.set('');
      }),
      switchMap((categoryId) => this.catalog.getProducts(categoryId ?? undefined).pipe(
        // La vista puede estar filtrada, pero el carrito siempre se valida contra el catálogo completo.
        switchMap((visibleProducts) => categoryId === null
          ? of({ visibleProducts, allProducts: visibleProducts })
          : this.catalog.getProducts().pipe(map((allProducts) => ({ visibleProducts, allProducts })))),
        catchError((error: HttpErrorResponse) => {
          this.error.set(error.status === 0
            ? 'No se pudo conectar con la API. Comprueba que el backend y PostgreSQL esten activos.'
            : 'No fue posible cargar los productos. Intenta de nuevo.');
          return of({ visibleProducts: [], allProducts: null });
        }),
      )),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(({ visibleProducts, allProducts }) => {
      this.products.set(visibleProducts);
      // Si falla la consulta completa no eliminamos artículos sólo por un error de red.
      if (allProducts !== null) this.cart.reconcile(allProducts);
      this.loading.set(false);
    });

    this.catalog.getCategories().pipe(
      catchError(() => {
        this.categoryError.set('No fue posible cargar las categorias.');
        return of([]);
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((categories) => this.categories.set(categories));
  }

  protected showSlide(index: number): void {
    this.currentSlide.set(index);
  }

  protected onCategoryChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    const categoryId = value ? Number(value) : null;
    this.selectedCategoryId.set(categoryId);
    this.categoryChanges.next(categoryId);
  }

  protected categoryName(id: number): string {
    return this.categories().find((category) => category.idCategoria === id)?.nombre ?? 'Catalogo';
  }

  protected retry(): void {
    this.categoryChanges.next(this.selectedCategoryId());
    this.catalog.getCategories().pipe(
      catchError(() => {
        this.categoryError.set('No fue posible cargar las categorias.');
        return of([]);
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((categories) => {
      this.categoryError.set('');
      this.categories.set(categories);
    });
  }

  protected onImageError(event: Event): void {
    const image = event.target as HTMLImageElement;
    const fallback = new URL(this.fallbackImage).href;
    if (image.src !== fallback) {
      image.src = fallback;
    }
  }

  protected addToCart(product: Producto): void {
    this.cart.add(product);
  }
}
