import { Pipe, PipeTransform } from '@angular/core';
import { relativeDayLabel } from '../../core/utils/date.utils';

/** "Hoje", "Amanhã", "em 3 dias", "2 dias atrás". */
@Pipe({ name: 'relativeDay' })
export class RelativeDayPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return value ? relativeDayLabel(value) : '';
  }
}
