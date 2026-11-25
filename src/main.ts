import {DOCUMENT, inject} from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import {provideRouter, withInMemoryScrolling, withViewTransitions} from '@angular/router';
import { AppComponent } from './app/app';
import {routes} from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, withInMemoryScrolling({
      anchorScrolling: 'enabled',
      scrollPositionRestoration: 'enabled'
    }), withViewTransitions({
      skipInitialTransition: true,
      onViewTransitionCreated: ({transition, from, to}) => {
        const window = inject(DOCUMENT).defaultView;
        if (from.firstChild?.routeConfig === to.firstChild?.routeConfig
          || window?.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          transition.skipTransition();
        }
      }
    }))
  ]
}).catch((error: unknown) => {
  console.error('Bootstrap failed', error);
});
