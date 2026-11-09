import { Directive, ElementRef, afterNextRender, inject } from '@angular/core';

/** Foca o elemento assim que ele é renderizado (útil em campos exibidos dinamicamente). */
@Directive({ selector: '[appAutofocus]' })
export class Autofocus {
  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    afterNextRender(() => element.focus());
  }
}
