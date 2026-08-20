import {Routes} from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./pages/navigator/navigator-page.component')
            .then(module => module.NavigatorPageComponent)
    },
    {
        path: 'trends',
        loadComponent: () => import('./pages/trends/trends-page.component')
            .then(module => module.TrendsPageComponent)
    },
    {
        path: '**',
        redirectTo: ''
    }
];
