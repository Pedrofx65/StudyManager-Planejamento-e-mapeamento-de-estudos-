import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Valida que a data final não é anterior à data inicial (nível de grupo). */
export function dateRangeValidator(startKey: string, endKey: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const start = group.get(startKey)?.value as string | null;
    const end = group.get(endKey)?.value as string | null;
    if (!start || !end) return null;
    return end < start ? { dateRange: true } : null;
  };
}

/** Valida que o horário final é posterior ao inicial (HH:mm). */
export function timeRangeValidator(startKey: string, endKey: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const start = group.get(startKey)?.value as string | null;
    const end = group.get(endKey)?.value as string | null;
    if (!start || !end) return null;
    return end <= start ? { timeRange: true } : null;
  };
}

/** Impede textos compostos apenas por espaços. */
export const notBlank: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value as unknown;
  if (typeof value === 'string' && value.length > 0 && value.trim().length === 0) {
    return { blank: true };
  }
  return null;
};
