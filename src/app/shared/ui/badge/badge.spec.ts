import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Badge } from './badge';

@Component({
  imports: [Badge],
  template: `<app-badge tono="peligro">Bloqueada</app-badge>`,
})
class Host {}

describe('Badge', () => {
  it('aplica la clase del tono y conserva el texto', () => {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('app-badge') as HTMLElement;

    expect(badge.classList).toContain('app-badge--peligro');
    expect(badge.textContent?.trim()).toBe('Bloqueada');
  });
});
