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

import {CommonModule} from '@angular/common';
import {Component, Inject} from '@angular/core';
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
    imports: [CommonModule, MatDialogModule],
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
        </div>y
    `
})
export class PreviewDialogComponent {
    constructor(
        @Inject(MAT_DIALOG_DATA) public readonly data: PreviewDialogData,
        private readonly dialogRef: MatDialogRef<PreviewDialogComponent>
    ) {
    }

    protected close(): void {
        this.dialogRef.close();
    }
}