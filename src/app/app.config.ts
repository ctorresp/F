import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // Sin withFetch(): Angular usa XHR que corre dentro de NgZone,
    // garantizando que la detección de cambios actualice la vista correctamente.
    // isPlatformBrowser en el servicio ya previene llamadas HTTP durante SSR.
    provideHttpClient(),
    provideClientHydration(withEventReplay())
  ]
};
