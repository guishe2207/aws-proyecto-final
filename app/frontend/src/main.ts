import { bootstrapApplication } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { appConfig } from './app/app.config';
import { Root } from './app/root';

registerLocaleData(localeEsCo);

bootstrapApplication(Root, appConfig)
  .catch((err) => console.error(err));
