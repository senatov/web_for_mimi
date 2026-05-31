import {AfterViewInit, Directive, ElementRef, inject} from '@angular/core';

const VERSION_PATTERN = String.raw`macOS\s+\d+(?:\.\d+)*|v?\d+(?:\.\d+){1,4}`;
const KEYWORD_PATTERN = String.raw`Total\s+Commander|App\s+Store|⌘-Click|⇧-Click|Cmd\+Click|Shift\+Click|macOS|DMG|SMB|EXIF|GitHub|SFTP|FTP|ZIP|RAR|7Z|TAR|GZIP|BZIP2|XZ|ISO|CAB|XAR|LZH|ARJ|CPIO|MP4|AVI|MKV|MOV|WEBM|FLV|WMV|MP3|WAV|FLAC|AAC|OGG|WMA|M4A|AIFF|PNG|JPEG|TIFF|BMP|WEBP|GIF|HEIC|SVG|F2|F5|F6|F7|AGPL-3\.0`;
const HIGHLIGHT_PATTERN = new RegExp(String.raw`(?<![\p{L}\p{N}_])(?:${VERSION_PATTERN}|${KEYWORD_PATTERN})(?![\p{L}\p{N}_])`, 'giu');
const SKIPPED_SELECTOR = [
    'a',
    'button',
    'script',
    'style',
    '.seo-keyword-highlight',
    '.hero-proof',
    '.hero-capabilities',
    '.brand-copy',
    '.release-panel',
    '.price-card',
    '.commit-feed'
].join(',');

@Directive({
    selector: '[appSeoKeywordHighlight]',
    standalone: true
})
export class SeoKeywordHighlightDirective implements AfterViewInit {
    private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
    private isHighlighting = false;

    ngAfterViewInit(): void {
        queueMicrotask(() => {
            this.highlight();
            new MutationObserver(() => {
                if (!this.isHighlighting) {
                    this.highlight();
                }
            }).observe(this.elementRef.nativeElement, {childList: true, characterData: true, subtree: true});
        });
    }

    private highlight(): void {
        this.isHighlighting = true;

        try {
            for (const textNode of this.collectTextNodes()) {
                this.highlightTextNode(textNode);
            }
        } finally {
            this.isHighlighting = false;
        }
    }

    private collectTextNodes(): Text[] {
        const nodes: Text[] = [];
        const walker = document.createTreeWalker(
            this.elementRef.nativeElement,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: node => {
                    if (!node.textContent || !HIGHLIGHT_PATTERN.test(node.textContent)) {
                        HIGHLIGHT_PATTERN.lastIndex = 0;
                        return NodeFilter.FILTER_REJECT;
                    }

                    HIGHLIGHT_PATTERN.lastIndex = 0;
                    return this.canHighlight(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                }
            }
        );

        let node = walker.nextNode();
        while (node) {
            nodes.push(node as Text);
            node = walker.nextNode();
        }

        return nodes;
    }

    private canHighlight(node: Node): boolean {
        return !node.parentElement?.closest(SKIPPED_SELECTOR);
    }

    private highlightTextNode(textNode: Text): void {
        const text = textNode.textContent || '';
        const fragment = document.createDocumentFragment();
        let currentIndex = 0;

        HIGHLIGHT_PATTERN.lastIndex = 0;

        for (const match of text.matchAll(HIGHLIGHT_PATTERN)) {
            const matchText = match[0];
            const matchIndex = match.index ?? 0;

            if (matchIndex > currentIndex) {
                fragment.append(document.createTextNode(text.slice(currentIndex, matchIndex)));
            }

            const highlight = document.createElement('span');
            highlight.className = 'seo-keyword-highlight';
            highlight.textContent = matchText;
            fragment.append(highlight);

            currentIndex = matchIndex + matchText.length;
        }

        if (currentIndex < text.length) {
            fragment.append(document.createTextNode(text.slice(currentIndex)));
        }

        textNode.replaceWith(fragment);
    }
}
