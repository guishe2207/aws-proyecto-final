import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// Contenedor de la aplicacion: la ruta decide si se muestra el catalogo o el panel.
@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  template: '<router-outlet />',
})
export class Root {}
