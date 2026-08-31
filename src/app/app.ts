import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {RouterOutlet} from '@angular/router';

import {AnalyticsService} from './analytics.service';
import {PageMetadataService} from './page-metadata.service';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet],
    template: '<router-outlet />',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
    // Capture the server-provided Navigator metadata before a routed page can replace it.
    private readonly pageMetadata = inject(PageMetadataService);
    // Keep page-view accounting aligned with Angular route changes.
    private readonly analytics = inject(AnalyticsService);
}
