import type { Component } from 'vue';
import type { CellType } from '@test-project/data-table';
import TextCell from '../molecules/cells/text-cell/TextCell.vue';
import Text from '../primitives/text/Text.vue';

/**
 * Cell-type registry — framework layer.
 *
 * Maps each CellType literal to the Vue component responsible for displaying
 * a cell of that type. The Data Table organism dispatches to this registry via
 * `<component :is="resolveCellRenderer(column.type)">` — it never switches on
 * `column.type` itself.
 *
 * Layer: lib/framework — framework plumbing (Vue component binding).
 *
 * Extension recipe (no restructure required):
 *   1. Extend CellType in libs/data-table.
 *   2. Add a new molecule under lib/molecules/cells/<type>-cell/.
 *   3. registry.set('<type>', XxxCell);
 *
 * Module-level Map — not a provide/inject context. Populated at module load
 * time and shared across all DataTable instances in the same app. Matches the
 * React module-level Map pattern for parity.
 */

// Registry: CellType literal → Vue component
const registry = new Map<CellType, Component>([['text', TextCell]]);

/**
 * Resolve the Vue renderer component for a given CellType.
 *
 * Unknown cell type in development: throws so the developer sees the
 * problem immediately (no silent data loss). In production the Text
 * primitive is returned as a graceful fallback so the table remains usable.
 */
export function resolveCellRenderer(type: CellType): Component {
  const renderer = registry.get(type);
  if (renderer) return renderer;

  if (import.meta.env.DEV) {
    throw new Error(`[DataTable] No renderer registered for cell type "${type}".`);
  }

  // Production graceful fallback — render raw value through the Text primitive.
  return Text;
}
