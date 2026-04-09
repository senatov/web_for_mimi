//
//  preview-dialog.component.ts
//  web_for_mimi
//
//  Created by Iakov Senatov.
//  Copyright © 2026 Iakov Senatov. All rights reserved.
//
//  Description:
//  Standalone preview dialog component for enlarged screenshot display.
//

import {Component, inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';

export interface PreviewDialogData {
    imageUrl: string;
    altText: string;
    title?: string;
    hint?: string;
}

@Component({
    selector: 'app-preview-dialog',
    standalone: true,
    imports: [MatDialogModule],
    template: `
        <div class="preview-dialog-shell">
            <button
                    type="button"
                    class="preview-dialog-close"
                    aria-label="Close preview"
                    (click)="close()"
            >
                ×
            </button>

            @if (data.title) {
                <div class="preview-dialog-title">{{ data.title }}</div>
            }

            <img
                    [src]="data.imageUrl"
                    [alt]="data.altText"
            >

            @if (data.hint) {
                <div class="preview-dialog-hint">{{ data.hint }}</div>
            }
        </div>
    `
})
export class PreviewDialogComponent {
    protected readonly data = inject<PreviewDialogData>(MAT_DIALOG_DATA);
    private readonly dialogRef = inject(MatDialogRef<PreviewDialogComponent>);

    protected close(): void {
        this.dialogRef.close();
    }
}