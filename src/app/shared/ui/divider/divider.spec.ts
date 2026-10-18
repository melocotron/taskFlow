import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Divider } from './divider';

@Component({
  imports: [Divider],
  template: `
    <app-divider />
    <app-divider vertical />
  `,
})
class Host {}

describe('Divider', () => {
  it('en horizontal renderiza un hr, que ya es un separador semántico', () => {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const hr = fixture.nativeElement.querySelector('hr') as HTMLElement;

    expect(hr).not.toBeNull();
  });

  it('en vertical anuncia su orientación', () => {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const vertical = fixture.nativeElement.querySelector('[aria-orientation="vertical"]');

    expect(vertical).not.toBeNull();
    expect(vertical?.getAttribute('role')).toBe('separator');
  });
});
