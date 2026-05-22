/**
 * Text primitive.
 *
 * The most fundamental text-rendering building block. Renders a string
 * value as plain text via a signal input, or projects content via
 * ng-content when the input is absent.
 *
 * Layer: lib/primitives/ — genuinely indivisible; no composition.
 * Canonical name: Text (from the Atomic Components inventory).
 * Selector: app-text.
 *
 * No domain types. No domain imports.
 */

import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-text',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `{{ text() }}<ng-content />`,
  host: {
    class: 'block',
  },
})
export class TextComponent {
  /**
   * The string value to render.
   * When provided, takes precedence over projected content.
   * When omitted, <ng-content> renders whatever is projected.
   */
  readonly text = input<string>('');
}
