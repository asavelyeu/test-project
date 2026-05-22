/**
 * Tests for the Text primitive.
 *
 * The Text primitive is the lowest-level text-rendering unit. These
 * tests verify that it renders its input value correctly.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TextComponent } from './text.component';

describe('TextComponent (Text primitive)', () => {
  let fixture: ComponentFixture<TextComponent>;
  let component: TextComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TextComponent);
    component = fixture.componentInstance;
  });

  it('renders the text input value', async () => {
    fixture.componentRef.setInput('text', 'Hello world');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent.trim()).toBe('Hello world');
  });

  it('renders an empty string when text input is empty', async () => {
    fixture.componentRef.setInput('text', '');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });

  it('US-09: renders arbitrary string values without transformation', async () => {
    fixture.componentRef.setInput('text', 'Any string value');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Any string value');
  });
});
