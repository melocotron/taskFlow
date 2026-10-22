import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renderiza el outlet donde se montan las páginas', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const outlet: HTMLElement | null = fixture.nativeElement.querySelector('router-outlet');

    expect(outlet).toBeTruthy();
  });
});
