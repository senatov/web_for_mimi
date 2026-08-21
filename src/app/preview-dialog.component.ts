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
            gap: 14px;
            width: 100vw;
            height: 100vh;
            padding: clamp(22px, 4vw, 52px);
            background: radial-gradient(circle at 50% 0, rgba(66, 111, 159, .22), transparent 42%), #09111f;
            box-sizing: border-box;
        }

        .preview-dialog-title,
        .preview-dialog-hint {
            color: #f8fafc;
            font-family: Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.35;
            text-align: center;
        }

        .preview-dialog-title {
            font-size: 16px;
            font-weight: 650;
        }

        .preview-dialog-hint {
            color: #aebbd0;
            font-size: 12px;
            font-weight: 500;
        }

        .preview-dialog-shell img {
            display: block;
            max-width: 100%;
            max-height: calc(100vh - 126px);
            object-fit: contain;
            border: 1px solid rgba(255, 255, 255, 0.18);
            border-radius: 14px;
            box-shadow: 0 28px 80px rgba(0, 0, 0, 0.5);
        }

        .preview-dialog-close {
            position: absolute;
            top: 18px;
            right: 18px;
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 44px;
            height: 44px;
            border: 1px solid rgba(255, 255, 255, 0.25);
            border-radius: 50%;
            background: rgba(11, 22, 39, 0.72);
            color: #fff;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(16px);
            font-size: 25px;
            cursor: pointer;
        }

        .preview-dialog-close:hover,
        .preview-dialog-close:focus-visible {
            background: rgba(255, 255, 255, 0.14);
            outline: 3px solid rgba(255, 255, 255, .45);
            outline-offset: 2px;
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
