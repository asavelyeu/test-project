/**
 * Tests for the Text Cell molecule.
 *
 * US-09: Text Cell renders a string value as plain text.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TextCellComponent } from './text-cell.component';

describe('TextCellComponent (Text Cell)', () => {
  let fixture: ComponentFixture<TextCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextCellComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TextCellComponent);
  });

  it('US-09: renders a string value as plain text', async () => {
    fixture.componentRef.setInput('value', 'Alice');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent.trim()).toBe('Alice');
  });

  it('US-09: coerces a number value to string', async () => {
    fixture.componentRef.setInput('value', 42);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent.trim()).toBe('42');
  });

  it('US-09: renders empty string when value is null', async () => {
    fixture.componentRef.setInput('value', null);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });

  it('US-09: renders empty string when value is undefined', async () => {
    fixture.componentRef.setInput('value', undefined);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });

  it('US-09: delegates rendering to the Text primitive', async () => {
    fixture.componentRef.setInput('value', 'Test value');
    fixture.detectChanges();
    await fixture.whenStable();

    // Text primitive renders via app-text selector
    const textPrimitive = fixture.nativeElement.querySelector('app-text');
    expect(textPrimitive).not.toBeNull();
    expect(textPrimitive.textContent.trim()).toBe('Test value');
  });
});
