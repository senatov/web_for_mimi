import {ChangeDetectionStrategy, Component} from '@angular/core';
import {RouterLink, RouterLinkActive} from '@angular/router';

@Component({
    selector: 'app-project-switcher',
    imports: [RouterLink, RouterLinkActive],
    template: `
        <nav aria-label="MiMi projects">
            @for (project of projects; track project.path) {
                <a [routerLink]="project.path" routerLinkActive="active"
                   [routerLinkActiveOptions]="matchProject" ariaCurrentWhenActive="page"
                   [class.trends]="project.path === '/mimitrendsios'">
                    <img [src]="project.icon" alt="" width="32" height="32">
                    <span class="project-copy">
                        <strong>{{ project.name }}</strong>
                        <span>{{ project.kind }}</span>
                    </span>
                </a>
            }
        </nav>
    `,
    styleUrl: './project-switcher.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectSwitcherComponent {
    protected readonly projects = [
        {path: '/', name: 'MiMiNavigator', kind: 'File manager', icon: '/images/navigator/appstore.png'},
        {path: '/mimitrendsios', name: 'mimiTrendsIOS', kind: 'Market radar', icon: '/images/trends/AppIcon-1024.png'}
    ] as const;

    protected readonly matchProject = {
        paths: 'exact', queryParams: 'ignored', matrixParams: 'ignored', fragment: 'ignored'
    } as const;
}
