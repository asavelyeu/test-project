/**
 * Public barrel for apps/angular-client/lib/.
 *
 * Re-exports the components and tokens that consumers (pages, tests)
 * need to import. Internal sub-directories remain importable directly
 * for fine-grained imports within lib/ itself.
 */

// Organism
export { DataTableComponent } from './organisms/data-table/data-table.component';

// Molecules — cell renderers
export { TextCellComponent } from './molecules/cells/text-cell/text-cell.component';

// Primitives
export { TextComponent } from './primitives/text/text.component';

// Framework — registry tokens and defaults
export {
  CELL_RENDERER_REGISTRY,
  DEFAULT_CELL_RENDERER_REGISTRY,
} from './framework/cell-registry';
export type {
  CellRendererComponent,
  CellRendererRegistry,
} from './framework/cell-registry.types';
