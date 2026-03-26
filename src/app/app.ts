import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  protected readonly featureList = [
    {
      title: 'Side-by-side clarity',
      text: 'Track repository state, working tree changes and file operations without visual clutter.'
    },
    {
      title: 'Built for keyboard speed',
      text: 'Fast navigation, crisp panels and focused actions for people who do not enjoy wasting hand movement.'
    },
    {
      title: 'macOS-first feel',
      text: 'Dense information, polished controls and a restrained visual language inspired by serious desktop tools.'
    }
  ];

  protected readonly detailList = [
    'Commit list and working tree in one flow',
    'Repository manager with recent projects',
    'Large diff and file views without noise',
    'Designed for dual-panel habits and precision'
  ];
}
