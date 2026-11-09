import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

/**
 * Exibe a mensagem de validação de um campo.
 * Uso: <app-field-error [control]="form.controls.name" [show]="isInvalid('name')" />
 */
@Component({
  selector: 'app-field-error',
  // Default: a mensagem depende do estado interno do controle, não só dos inputs.
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    @if (show()) {
      <div class="invalid-feedback d-block">{{ message() }}</div>
    }
  `,
})
export class FieldError {
  readonly control = input.required<AbstractControl>();
  readonly show = input(false);

  protected message(): string {
    const errors = this.control().errors;
    if (!errors) return '';
    if (errors['required']) return 'Campo obrigatório.';
    if (errors['blank']) return 'Informe um texto válido.';
    if (errors['minlength']) return `Mínimo de ${errors['minlength'].requiredLength} caracteres.`;
    if (errors['maxlength']) return `Máximo de ${errors['maxlength'].requiredLength} caracteres.`;
    if (errors['min']) return `O valor mínimo é ${errors['min'].min}.`;
    if (errors['max']) return `O valor máximo é ${errors['max'].max}.`;
    if (errors['pattern']) return 'Formato inválido.';
    return 'Valor inválido.';
  }
}
