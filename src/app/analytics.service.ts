import {DOCUMENT} from '@angular/common';
import {inject, Injectable} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {distinctUntilChanged, filter, map} from 'rxjs';

declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void;
    }
}

@Injectable({providedIn: 'root'})
export class AnalyticsService {
    private readonly document = inject(DOCUMENT);
    private readonly router = inject(Router);

    constructor() {
        this.router.events.pipe(
            filter((event): event is NavigationEnd => event instanceof NavigationEnd),
            map(event => event.urlAfterRedirects.split('#', 1)[0] || '/'),
            distinctUntilChanged()
        ).subscribe(path => this.trackPageView(path));
    }

    private trackPageView(path: string): void {
        if (typeof window === 'undefined' || window.location.hostname !== 'miminavi.tech') {
            return;
        }

        window.gtag?.('event', 'page_view', {
            page_location: new URL(path, window.location.origin).href,
            page_path: path,
            page_title: this.document.title
        });
    }
}
