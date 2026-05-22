/**
 * Cell-type renderer registry for the Angular Data Table.
 *
 * Provides the InjectionToken and the default registry that maps
 * CellType literals to their Angular component renderers. Register
 * new cell types by extending DEFAULT_CELL_RENDERER_REGISTRY in
 * app.config.ts (or a feature-level provider) when new cell-type
 * tickets land.
 *
 * Layer: lib/framework/ — this is Angular DI plumbing.
 * No domain types. No domain imports.
 */

import { InjectionToken } from '@angular/core';
import { TextCellComponent } from '../molecules/cells/text-cell/text-cell.component';
import type { CellRendererRegistry } from './cell-registry.types';

/**
 * InjectionToken for the cell-renderer registry.
 *
 * Inject this in the Data Table organism to look up the renderer
 * for each column's `type` discriminant.
 */
export const CELL_RENDERER_REGISTRY = new InjectionToken<CellRendererRegistry>(
  'CELL_RENDERER_REGISTRY',
);

/**
 * Default registry shipped with the Angular client.
 *
 * NGI-12: only the Text Cell renderer is registered.
 * Extending: add a new Map entry here (or provide a new map in a
 * feature-level provider) when the next cell-type ticket lands.
 */
export const DEFAULT_CELL_RENDERER_REGISTRY: CellRendererRegistry = new Map([
  ['text', TextCellComponent],
] as const);
