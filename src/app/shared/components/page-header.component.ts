import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
      <div class="min-w-0">
        <h1 class="text-2xl lg:text-3xl font-bold text-dark-900">{{ title() }}</h1>
        <p class="text-dark-500 mt-1">{{ subtitle() }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-2.5 flex-shrink-0">
        <ng-content />
      </div>
    </div>
  `,
})
export class PageHeaderComponent {
  title = input.required<string>();
  subtitle = input.required<string>();
}
