import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import {
  CELL_RENDERER_REGISTRY,
  DEFAULT_CELL_RENDERER_REGISTRY,
} from './lib/framework/cell-registry';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    {
      provide: CELL_RENDERER_REGISTRY,
      useValue: DEFAULT_CELL_RENDERER_REGISTRY,
    },
  ],
};
