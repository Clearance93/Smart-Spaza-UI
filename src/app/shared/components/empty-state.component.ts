import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div class="text-5xl mb-4">{{ icon() }}</div>
      <h3 class="text-lg font-semibold text-dark-900 mb-1">{{ title() }}</h3>
      <p class="text-sm text-dark-500 max-w-sm">{{ description() }}</p>
    </div>
  `
})
export class EmptyStateComponent {
  icon = input.required<string>();
  title = input.required<string>();
  description = input.required<string>();
}
