import {AfterViewInit, ChangeDetectorRef, Component, ElementRef, inject, OnDestroy, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';

export interface PreviewDialogData {
    imageUrl: string;
    altText: string;
    title?: string;
    hint?: string;
}

@Component({
    selector: 'app-preview-dialog',
    standalone: true,
    imports: [MatDialogModule, MatButtonModule],
    template: `
        <section class="screenshot-viewer" aria-label="Screenshot viewer">
            <header>
                <h2 mat-dialog-title>{{ data.title || 'Screenshot' }}</h2>
                <button mat-button (click)="close()" aria-label="Close screenshot preview">Close ✕</button>
            </header>
            <div class="viewer-toolbar" role="group" aria-label="Image zoom controls">
                <button mat-button (click)="setZoom(zoom / 1.25)" [disabled]="!ready || zoom <= 1" aria-label="Zoom out">−</button>
                <output aria-live="polite">{{ ready ? percentage + '%' : 'Loading…' }}</output>
                <button mat-button (click)="setZoom(zoom * 1.25)" [disabled]="!ready || zoom >= maximumZoom" aria-label="Zoom in">+</button>
                <button mat-button (click)="setZoom(1)" [disabled]="!ready">Fit</button>
                <button mat-button (click)="setZoom(1 / fitScale)" [disabled]="!ready">100%</button>
                <a mat-button [href]="data.imageUrl" target="_blank" rel="noopener noreferrer">Open original ↗</a>
            </div>
            <div #stage class="viewer-stage" tabindex="0" aria-label="Screenshot. Scroll to inspect enlarged details.">
                @if (failed) { <p role="alert">This screenshot could not be loaded. Try opening the original image.</p> }
                <img [src]="data.imageUrl" [alt]="data.altText" (load)="imageLoaded($event)" (error)="failed = true"
                     [style.width.px]="ready ? naturalWidth * fitScale * zoom : null"
                     [style.height.px]="ready ? naturalHeight * fitScale * zoom : null">
            </div>
            <footer>Fit preserves the complete image. Use 100% for pixel detail; scroll to pan. Esc closes the viewer.</footer>
        </section>
    `,
    styles: [`
        :host { display: block; height: 100%; color: #e7edf6; }
        .screenshot-viewer { display: flex; flex-direction: column; height: 100%; background: #111b2a; }
        header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 18px; }
        h2.mat-mdc-dialog-title { margin: 0; padding: 0; color: #e7edf6; font-size: 16px; line-height: 1.4; }
        h2::before { display: none; }
        .viewer-toolbar { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 4px; padding: 6px 10px; border-block: 1px solid #344155; }
        .screenshot-viewer button, .screenshot-viewer a { --mat-button-text-label-text-color: #e7edf6; --mat-button-text-disabled-label-text-color: #7e8b9e; }
        output { min-width: 56px; text-align: center; font-variant-numeric: tabular-nums; }
        .viewer-stage { flex: 1; min-height: 0; overflow: auto; padding: 16px; overscroll-behavior: contain; }
        .viewer-stage:focus-visible { outline: 2px solid #9bc1ff; outline-offset: -3px; }
        img { display: block; margin: auto; max-width: none; object-fit: contain; }
        footer { padding: 10px 16px; color: #afbdd0; font-size: 12px; text-align: center; }
        @media (max-width: 600px) { header { padding: 8px 12px; } footer { font-size: 11px; } }
    `]
})
export class PreviewDialogComponent implements AfterViewInit, OnDestroy {
    protected readonly data = inject<PreviewDialogData>(MAT_DIALOG_DATA);
    private readonly dialogRef = inject(MatDialogRef<PreviewDialogComponent>);
    private readonly cdr = inject(ChangeDetectorRef);
    @ViewChild('stage', {static: true}) private stage!: ElementRef<HTMLDivElement>;
    private observer?: ResizeObserver;
    protected naturalWidth = 0;
    protected naturalHeight = 0;
    protected fitScale = 1;
    protected zoom = 1;
    protected failed = false;
    protected get ready(): boolean { return this.naturalWidth > 0; }
    protected get percentage(): number { return Math.round(this.fitScale * this.zoom * 100); }
    protected get maximumZoom(): number { return Math.max(4, 1 / this.fitScale); }

    ngAfterViewInit(): void {
        this.observer = new ResizeObserver(() => this.fitImage());
        this.observer.observe(this.stage.nativeElement);
    }
    ngOnDestroy(): void { this.observer?.disconnect(); }
    protected imageLoaded(event: Event): void {
        const image = event.target as HTMLImageElement;
        this.naturalWidth = image.naturalWidth;
        this.naturalHeight = image.naturalHeight;
        this.fitImage();
    }
    private fitImage(): void {
        if (!this.ready) return;
        const stage = this.stage.nativeElement;
        this.fitScale = Math.max(0.01, Math.min((stage.offsetWidth - 48) / this.naturalWidth, (stage.offsetHeight - 48) / this.naturalHeight, 1));
        this.cdr.markForCheck();
    }
    protected setZoom(value: number): void { this.zoom = Math.min(this.maximumZoom, Math.max(1, value)); }
    protected close(): void { this.dialogRef.close(); }
}
