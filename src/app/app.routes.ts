import {Routes} from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./pages/navigator/navigator-page.component')
            .then(module => module.NavigatorPageComponent)
    },
    {
        path: 'mimitrendsios',
        loadComponent: () => import('./pages/trends/trends-page.component')
            .then(module => module.TrendsPageComponent)
    },
    {
        path: 'trends',
        redirectTo: 'mimitrendsios',
        pathMatch: 'full'
    },
    {
        path: '**',
        redirectTo: ''
    }
];
