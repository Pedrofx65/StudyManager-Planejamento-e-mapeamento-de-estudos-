import { signal } from '@angular/core';
import { FormGroup } from '@angular/forms';

/**
 * Comportamento comum aos formulários: controle de envio e exibição de erros.
 * As subclasses declaram `form` com seus controles tipados.
 */
export abstract class BaseForm {
  abstract readonly form: FormGroup;
  protected readonly submitted = signal(false);

  /** Erro visível quando o campo foi tocado ou após tentativa de envio. */
  protected isInvalid(name: string): boolean {
    const control = this.form.get(name);
    return !!control && control.invalid && (control.touched || this.submitted());
  }

  /** Marca o envio; retorna false (e destaca os erros) se o formulário for inválido. */
  protected validate(): boolean {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return false;
    }
    return true;
  }
}
