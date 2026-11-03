import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../environments/environment';
import { App } from './app';
import { CartService } from './cart/cart.service';

registerLocaleData(localeEsCo);

describe('App', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: LOCALE_ID, useValue: 'es-CO' },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
    http.expectOne(`${environment.apiUrl}/productos`).flush({ data: [] });
    http.expectOne(`${environment.apiUrl}/categorias`).flush({ data: [] });
  });

  it('filters products through the API without replacing the view', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/categorias`).flush({
      data: [{ idCategoria: 1, nombre: 'Bolsos', descripcion: null }],
    });
    http.expectOne(`${environment.apiUrl}/productos`).flush({ data: [] });
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = '1';
    select.dispatchEvent(new Event('change'));

    const filteredRequest = http.expectOne((request) =>
      request.url === `${environment.apiUrl}/productos` && request.params.get('categoriaId') === '1',
    );
    filteredRequest.flush({
      data: [{
        idProducto: 7,
        nombre: 'Bolso de prueba',
        descripcion: null,
        precio: 45000,
        stock: 2,
        imagen: null,
        idCategoria: 1,
      }],
    });
    http.expectOne((request) => request.url === `${environment.apiUrl}/productos` && !request.params.has('categoriaId')).flush({ data: [{
      idProducto: 7, nombre: 'Bolso de prueba', descripcion: null, precio: 45000, stock: 2, imagen: null, idCategoria: 1,
    }] });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.product-item').length).toBe(1);
    expect(fixture.nativeElement.querySelector('h3')?.textContent).toContain('Bolso de prueba');
  });

  it('al filtrar conserva en el carrito productos de otra categoría y actualiza su stock desde el catálogo completo', () => {
    const cart = TestBed.inject(CartService);
    const categoryOne = { idProducto: 1, nombre: 'Uno', descripcion: null, precio: 1000, stock: 3, imagen: null, idCategoria: 1 };
    const categoryTwo = { idProducto: 2, nombre: 'Dos', descripcion: null, precio: 2000, stock: 2, imagen: null, idCategoria: 2 };
    cart.add(categoryOne); cart.add(categoryTwo); cart.add(categoryTwo);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/productos`).flush({ data: [categoryOne, categoryTwo] });
    http.expectOne(`${environment.apiUrl}/categorias`).flush({ data: [{ idCategoria: 1, nombre: 'Uno', descripcion: null }] });
    fixture.detectChanges();
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = '1'; select.dispatchEvent(new Event('change'));
    http.expectOne((request) => request.params.get('categoriaId') === '1').flush({ data: [categoryOne] });
    http.expectOne((request) => !request.params.has('categoriaId')).flush({ data: [categoryOne, { ...categoryTwo, stock: 1 }] });
    expect(cart.items().map((item) => [item.producto.idProducto, item.cantidad])).toEqual([[1, 1], [2, 1]]);
  });

  it('muestra el numero de la imagen de portada y cambia de imagen al elegir un punto', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    http.expectOne(`${environment.apiUrl}/productos`).flush({ data: [] });
    http.expectOne(`${environment.apiUrl}/categorias`).flush({ data: [] });
    fixture.detectChanges();

    const counter = fixture.nativeElement.querySelector('.slide-count') as HTMLElement;
    expect(counter.textContent?.trim()).toBe('01 / 03');

    const dots = fixture.nativeElement.querySelectorAll('.slide-dot') as NodeListOf<HTMLButtonElement>;
    dots[1].click();
    fixture.detectChanges();

    expect(counter.textContent?.trim()).toBe('02 / 03');
    expect(dots[1].classList.contains('is-active')).toBe(true);
  });
});
