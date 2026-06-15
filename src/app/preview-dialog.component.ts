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
    styles: [`
        .preview-dialog-shell {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 12px;
            width: 100vw;
            height: 100vh;
            padding: 18px;
            background: #f8fafc;
            box-sizing: border-box;
        }

        .preview-dialog-title,
        .preview-dialog-hint {
            color: #183f6f;
            font-family: Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.35;
            text-align: center;
        }

        .preview-dialog-title {
            font-size: 14px;
            font-weight: 700;
        }

        .preview-dialog-hint {
            font-size: 12px;
            font-weight: 500;
        }

        .preview-dialog-shell img {
            display: block;
            max-width: 100%;
            max-height: calc(100vh - 88px);
            object-fit: contain;
            border: 1px solid rgba(95, 99, 104, 0.22);
            border-radius: 10px;
            box-shadow: 0 16px 44px rgba(13, 31, 74, 0.18);
            filter: contrast(1.08) saturate(1.06);
        }

        .preview-dialog-close {
            position: absolute;
            top: 14px;
            right: 14px;
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border: 1px solid rgba(24, 63, 111, 0.18);
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.9);
            color: #183f6f;
            box-shadow: 0 8px 18px rgba(13, 31, 74, 0.14);
            font-size: 20px;
            cursor: pointer;
        }

        .preview-dialog-close:hover,
        .preview-dialog-close:focus-visible {
            background: #fff;
            outline: 0;
        }
    `],
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
