import { Component, input } from '@angular/core';

export type StatTone = 'purple' | 'blue' | 'orange' | 'emerald' | 'pink' | 'cyan';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  template: `
    <div class="rounded-2xl border border-dark-100 bg-white p-5 card-shadow">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-[11px] font-semibold text-dark-500 uppercase tracking-wide">{{ label() }}</p>
          <p class="text-2xl lg:text-[1.9rem] font-bold text-dark-900 mt-1.5 leading-tight truncate">{{ value() }}</p>
          @if (hint()) {
            <p class="text-xs mt-1" [class]="hintClass()">{{ hint() }}</p>
          }
        </div>
        <div class="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0" [class]="toneClass()">
          {{ icon() }}
        </div>
      </div>
    </div>
  `,
})
export class StatCardComponent {
  label = input.required<string>();
  value = input.required<string>();
  hint = input<string>('');
  icon = input<string>('📊');
  tone = input<StatTone>('purple');
  trend = input<'up' | 'down' | 'neutral'>('neutral');

  toneClass = () => {
    const map: Record<StatTone, string> = {
      purple: 'bg-primary-100 text-primary-600',
      blue: 'bg-primary-100 text-primary-600',
      orange: 'bg-orange-100 text-orange-600',
      emerald: 'bg-emerald-100 text-emerald-600',
      pink: 'bg-pink-100 text-pink-600',
      cyan: 'bg-primary-100 text-primary-600',
    };
    return map[this.tone()];
  };

  hintClass = () => {
    return { up: 'text-emerald-600 font-medium', down: 'text-red-500 font-medium', neutral: 'text-dark-400' }[
      this.trend()
    ];
  };
}
