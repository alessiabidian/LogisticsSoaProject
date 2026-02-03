import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {RxStompService} from './components/services/rx-stomp';
import {RxStompServiceFactory} from './components/services/rx-stomp-factory';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    {
      provide: RxStompService,
      useFactory: RxStompServiceFactory,
    },
  ]
};
