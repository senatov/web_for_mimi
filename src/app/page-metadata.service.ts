import {DOCUMENT} from '@angular/common';
import {inject, Injectable} from '@angular/core';

interface MetaSnapshot {
    attribute: 'name' | 'property';
    key: string;
    content: string;
}

@Injectable({providedIn: 'root'})
export class PageMetadataService {
    private readonly document = inject(DOCUMENT);
    private readonly navigatorTitle = this.document.title;
    private readonly navigatorCanonical = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? 'https://miminavi.tech/';
    private readonly navigatorFavicon = this.document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.getAttribute('href') ?? '/favicon.ico';
    private readonly navigatorMeta = this.captureMeta();
    private readonly navigatorStructuredData = Array.from(
        this.document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]')
    ).map(element => element.text);

    restoreNavigator(): void {
        this.document.title = this.navigatorTitle;
        this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', this.navigatorCanonical);
        this.document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.setAttribute('href', this.navigatorFavicon);

        for (const meta of this.navigatorMeta) {
            this.document.querySelector<HTMLMetaElement>(`meta[${meta.attribute}="${meta.key}"]`)
                ?.setAttribute('content', meta.content);
        }

        this.document.querySelectorAll('script[type="application/ld+json"]').forEach(element => element.remove());
        for (const text of this.navigatorStructuredData) {
            const element = this.document.createElement('script');
            element.type = 'application/ld+json';
            element.text = text;
            this.document.head.appendChild(element);
        }
    }

    updateNavigatorRelease(version: string, datePublished: string | null | undefined, downloadUrl: string): void {
        for (const element of this.document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]')) {
            try {
                const data = JSON.parse(element.text) as Record<string, unknown>;
                if (data['@type'] !== 'SoftwareApplication' || data['name'] !== 'MiMiNavigator') {
                    continue;
                }

                data['softwareVersion'] = version.replace(/^v/, '');
                data['downloadUrl'] = downloadUrl;
                if (datePublished) {
                    data['datePublished'] = datePublished.slice(0, 10);
                }
                element.text = JSON.stringify(data);
                return;
            } catch {
                // Ignore unrelated or malformed structured-data blocks.
            }
        }
    }

    private captureMeta(): MetaSnapshot[] {
        const snapshots: MetaSnapshot[] = [];
        for (const element of this.document.querySelectorAll<HTMLMetaElement>('meta[name], meta[property]')) {
            const name = element.getAttribute('name');
            const property = element.getAttribute('property');
            const content = element.getAttribute('content');
            if (name && content !== null) {
                snapshots.push({attribute: 'name', key: name, content});
            } else if (property && content !== null) {
                snapshots.push({attribute: 'property', key: property, content});
            }
        }
        return snapshots;
    }
}
