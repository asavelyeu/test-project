<script setup lang="ts" generic="TRow">
/**
 * Data Table — organism.
 *
 * Top-level shell that accepts DataTableProps<TRow> and renders Table Rows from
 * the `data` array using the `columns` configuration. Cell rendering is dispatched
 * to the cell-type registry — this organism does not switch on `column.type` itself.
 *
 * Layer: lib/organisms — owns the coordination of header, body, row, and cell
 * structure; consumes the framework registry seam.
 *
 * NGI-12 scope:
 *   - Renders rows from data / columns (Default State).
 *   - Accepts isLoading / error / emptyStateMessage as props (no distinct UI yet —
 *     those state organisms ship in later tickets: US-05, US-06).
 *   - Hover State: pure CSS `hover:bg-slate-50` on each Table Row (US-04).
 *   - Native table semantics: <table>, <thead>, <tbody>, <tr>, <th scope="col">, <td>.
 *
 * Hover State: `hover:bg-slate-50` on the <tr> — pure CSS Tailwind, no JS event
 * handlers. Background-color only; cell content and layout are unaffected.
 *
 * Reactivity: props are bound directly in the template `v-for`. No snapshot into
 * a plain local constant outside a computed — that would break Vue reactivity
 * (react-to-prop-change AC item 3). (reactivity.md rule honored.)
 *
 * Canonical name comments label each structural section so later tickets can
 * extract them as named components without renaming.
 */
import type { DataTableProps, CellAlignment } from '@test-project/data-table';
import { resolveCellRenderer } from '../../framework/cell-registry';

// isLoading / error / emptyStateMessage are accepted in props but no distinct
// UI is rendered in NGI-12 — those state organisms ship in later tickets (US-05, US-06).
const props = defineProps<DataTableProps<TRow>>();

/** Map CellAlignment → Tailwind text-align utility class. */
function alignClass(align?: CellAlignment): string {
  if (align === 'end') return 'text-right';
  if (align === 'center') return 'text-center';
  if (align === 'start') return 'text-left';
  return '';
}

/**
 * Return a stable key string for a row.
 *
 * Strategy: prefer the value of the first column (converted to string) since
 * it is the most human-meaningful stable identifier. Fall back to the array
 * index with a DEV warning so the developer knows they should supply a stable
 * `id` field or ensure first-column values are unique.
 */
function rowKey(row: TRow, index: number): string | number {
  const firstCol = props.columns[0];
  if (firstCol) {
    const val = row[firstCol.key as keyof TRow];
    if (val != null && val !== '') return String(val);
  }
  if (import.meta.env.DEV) {
    console.warn(
      '[DataTable] Could not derive a stable row key from the first column value. ' +
        'Falling back to array index. Provide non-empty first-column values or add an `id` field ' +
        'to ensure stable keys during re-renders.',
    );
  }
  return index;
}
</script>

<template>
  <!-- Data Table -->
  <table class="w-full border-collapse text-sm">
    <!-- Table Header -->
    <thead>
      <tr>
        <!-- Table Header Cell -->
        <th
          v-for="column in props.columns"
          :key="column.id ?? column.key"
          scope="col"
          :class="[
            'border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-700',
            alignClass(column.align),
          ]"
        >
          {{ column.header }}
        </th>
      </tr>
    </thead>

    <tbody>
      <!-- Table Row — hover:bg-slate-50 is the Hover State (US-04).
           Pure CSS: no JS state, no event handlers, background-color only. -->
      <tr
        v-for="(row, index) in props.data"
        :key="rowKey(row, index)"
        class="border-b border-slate-100 last:border-0 hover:bg-slate-50"
      >
        <!-- Table Cell -->
        <td
          v-for="column in props.columns"
          :key="column.id ?? column.key"
          :class="['px-4 py-3 text-slate-900', alignClass(column.align)]"
        >
          <component
            :is="resolveCellRenderer(column.type)"
            :value="row[column.key as keyof TRow]"
            :column="column"
            :row="row"
          />
        </td>
      </tr>
    </tbody>
  </table>
</template>
