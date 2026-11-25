import {afterNextRender, ChangeDetectionStrategy, Component, DOCUMENT, ElementRef, inject, Injector} from '@angular/core';
import {RouterOutlet} from '@angular/router';

import {AnalyticsService} from './analytics.service';
import {PageMetadataService} from './page-metadata.service';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet],
    template: '<router-outlet (activate)="animateProjectEntry()" />',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
    private readonly document = inject(DOCUMENT);
    private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
    private readonly injector = inject(Injector);
    private hasActivatedProject = false;
    private entryAnimation?: Animation;

    protected animateProjectEntry(): void {
        const hadProject = this.hasActivatedProject;
        this.hasActivatedProject = true;

        const window = this.document.defaultView;
        if (!hadProject || !window || typeof this.document.startViewTransition === 'function'
            || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        afterNextRender(() => {
            const page = this.host.nativeElement.querySelector<HTMLElement>('.page-shell');
            if (!page) return;

            this.entryAnimation?.cancel();
            const offset = page.classList.contains('trends-page') ? 18 : -18;
            this.entryAnimation = page.animate([
                {opacity: 0, transform: `translateX(${offset}px)`},
                {opacity: 1, transform: 'translateX(0)'}
            ], {duration: 260, easing: 'cubic-bezier(.2, .75, .25, 1)'});
        }, {injector: this.injector});
    }

    // Capture the server-provided Navigator metadata before a routed page can replace it.
    private readonly pageMetadata = inject(PageMetadataService);
    // Keep page-view accounting aligned with Angular route changes.
    private readonly analytics = inject(AnalyticsService);
}
