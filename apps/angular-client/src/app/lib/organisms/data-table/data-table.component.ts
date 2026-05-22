/**
 * Data Table organism.
 *
 * Top-level shell that accepts the DataTableProps<T> contract and renders
 * one Table Row per data item, dispatching each cell to the registered
 * cell-type renderer via NgComponentOutlet.
 *
 * Layer: lib/organisms/data-table/ — owns rendering coordination.
 * Canonical name: Data Table (CLAUDE.md §4).
 * Selector: app-data-table.
 *
 * State props accepted (organisms for them ship in later tickets):
 *   - isLoading: boolean — Loading State organism (US-06)
 *   - error: unknown — Error State organism (future ticket)
 *   - emptyStateMessage: string | undefined — Empty State organism (US-05)
 *
 * No domain types. No domain imports.
 *
 * @tanstack/table-core wiring is deferred — see design.md "Decisions Deferred".
 */

import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  Type,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import type { ColumnConfig, CellType } from '@test-project/data-table';
import {
  CELL_RENDERER_REGISTRY,
} from '../../framework/cell-registry';
import { TextCellComponent } from '../../molecules/cells/text-cell/text-cell.component';
import type { CellRendererComponent } from '../../framework/cell-registry.types';

@Component({
  selector: 'app-data-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgComponentOutlet],
  templateUrl: './data-table.component.html',
})
export class DataTableComponent<TRow extends object> {
  // ---- Inputs (one per DataTableProps<T> field) ----

  /**
   * Column definitions that drive Table Header Cell labels and cell
   * rendering. Columns are rendered in declared order.
   */
  readonly columns = input.required<readonly ColumnConfig<TRow>[]>();

  /**
   * Rows to render. One Table Row is emitted per element.
   * Order matches the source array.
   */
  readonly data = input.required<readonly TRow[]>();

  /**
   * When true the table is in Loading State.
   * Loading State organism ships in US-06 — prop accepted now so that
   * ticket is a purely additive change.
   */
  readonly isLoading = input<boolean>(false);

  /**
   * Non-null when the table is in Error State.
   * Error State organism ships in a later ticket.
   */
  readonly error = input<unknown>(undefined);

  /**
   * Copy to show in the Empty State organism (US-05).
   * The Empty State organism ships in a later ticket; prop carried now
   * so that ticket is a purely additive change.
   */
  readonly emptyStateMessage = input<string | undefined>(undefined);

  // ---- Registry ----

  private readonly registry = inject(CELL_RENDERER_REGISTRY);

  // ---- Track-by helpers ----

  /**
   * TrackBy for @for over columns.
   * Uses col.id when present; falls back to col.key.
   */
  trackColumn(_index: number, col: ColumnConfig<TRow>): string {
    return col.id ?? col.key;
  }

  /**
   * TrackBy for @for over rows.
   * Uses the array index; a stable row identifier can replace this
   * in a later ticket without API changes.
   */
  trackRow(index: number, _row: TRow): number {
    return index;
  }

  // ---- Cell-value accessor ----

  /**
   * Extracts the cell value from a row for the given column key.
   * Typed as unknown because the registry boundary cannot guarantee
   * a narrower type; each renderer coerces or narrows.
   */
  cellValue(row: TRow, key: string): unknown {
    return (row as Record<string, unknown>)[key];
  }

  // ---- Registry dispatcher ----

  /**
   * Returns the renderer component for the given CellType.
   *
   * In dev mode: throws when the type is not registered so that
   * missing registrations surface immediately during development.
   * In production: falls back to TextCellComponent to avoid a blank cell.
   */
  rendererFor(type: CellType): Type<unknown> {
    const renderer = this.registry.get(type);

    if (!renderer) {
      if (typeof ngDevMode !== 'undefined' && ngDevMode) {
        throw new Error(
          `[DataTableComponent] No renderer registered for cell type "${type}". ` +
            `Register it in CELL_RENDERER_REGISTRY via app.config.ts.`,
        );
      }
      // Production fallback: render raw value as text.
      return TextCellComponent as CellRendererComponent;
    }

    return renderer;
  }

  /**
   * Builds the inputs object passed to NgComponentOutlet for a cell.
   * Every renderer receives value, column, and row so that complex
   * future renderers (Avatar Cell, Icon + Text Cell) have full context.
   */
  cellInputs(
    row: TRow,
    col: ColumnConfig<TRow>,
  ): Record<string, unknown> {
    return {
      value: this.cellValue(row, col.key),
      column: col,
      row,
    };
  }
}
