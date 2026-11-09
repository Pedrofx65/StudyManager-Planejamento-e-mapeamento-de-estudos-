import { Pipe, PipeTransform } from '@angular/core';
import { formatClock, formatDuration } from '../../core/utils/date.utils';

/**
 * Formata uma duração.
 *  {{ 8100 | duration }}            → "2h 15min"
 *  {{ 90 | duration:'minutes' }}    → "1h 30min"
 *  {{ 125 | duration:'clock' }}     → "00:02:05"
 */
@Pipe({ name: 'duration' })
export class DurationPipe implements PipeTransform {
  transform(value: number | null | undefined, mode: 'seconds' | 'minutes' | 'clock' = 'seconds'): string {
    const n = value ?? 0;
    if (mode === 'clock') return formatClock(n);
    return formatDuration(mode === 'minutes' ? n * 60 : n);
  }
}
