import { Component, input } from '@angular/core';

@Component({
  selector: 'app-card-skeleton',
  standalone: true,
  template: `
    @for (i of countArray(); track i) {
      <div class="bg-white rounded-2xl border border-dark-100 p-5 card-shadow animate-pulse">
        <div class="flex items-start justify-between">
          <div class="flex-1 space-y-3">
            <div class="h-3 bg-dark-100 rounded w-24"></div>
            <div class="h-8 bg-dark-100 rounded w-32"></div>
            <div class="h-3 bg-dark-100 rounded w-20"></div>
          </div>
          <div class="w-12 h-12 bg-dark-100 rounded-xl"></div>
        </div>
      </div>
    }
  `
})
export class CardSkeletonComponent {
  count = input<number>(1);
  countArray = /* @__PURE__ */ (() => {
    return () => Array.from({ length: this.count() }, (_, i) => i + 1);
  })();
}
