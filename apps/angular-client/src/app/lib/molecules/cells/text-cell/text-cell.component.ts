/**
 * Text Cell molecule.
 *
 * Concrete cell renderer for columns where `column.type === 'text'`.
 * Coerces the incoming value to a string and delegates rendering to
 * the Text primitive. This is the only cell-type renderer shipped
 * in NGI-12.
 *
 * Layer: lib/molecules/cells/ — focused cell renderer; composes one primitive.
 * Canonical name: Text Cell (CLAUDE.md §4).
 * Selector: app-text-cell.
 *
 * No domain types. No domain imports.
 */

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { ColumnConfig } from '@test-project/data-table';
import { TextComponent } from '../../../primitives/text/text.component';

@Component({
  selector: 'app-text-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TextComponent],
  template: `<app-text [text]="displayValue()" />`,
})
export class TextCellComponent {
  /**
   * Raw cell value from the row. Typed as unknown because the registry
   * boundary cannot guarantee a narrower type — the Text Cell coerces
   * it to string.
   */
  readonly value = input<unknown>();

  /**
   * The column configuration driving this cell. Provided by the Data
   * Table shell via NgComponentOutlet inputs.
   */
  readonly column = input<ColumnConfig<unknown>>();

  /**
   * The full row object. Provided for future cell types that need
   * multi-field access (e.g., Icon + Text Cell). Text Cell ignores it.
   */
  readonly row = input<unknown>();

  /** Coerces value to a string for the Text primitive. */
  readonly displayValue = computed<string>(() => String(this.value() ?? ''));
}
