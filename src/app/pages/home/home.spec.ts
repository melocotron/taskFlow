import { TestBed } from '@angular/core/testing';
import HomePage from './home';

describe('HomePage', () => {
  it('presenta el nombre del producto', async () => {
    await TestBed.configureTestingModule({ imports: [HomePage] }).compileComponents();

    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const titulo: HTMLElement | null = fixture.nativeElement.querySelector('h1');

    expect(titulo?.textContent).toContain('TaskFlow');
  });
});
