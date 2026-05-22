/**
 * Type definitions for the cell-type renderer registry.
 *
 * The registry maps a CellType literal to the Angular component class
 * responsible for rendering that cell. Each entry is an Angular
 * component constructor (Type<unknown>); the Data Table shell
 * instantiates it via NgComponentOutlet.
 *
 * This file has no domain types and no domain imports.
 */

import type { Type } from '@angular/core';
import type { CellType } from '@test-project/data-table';

/** An Angular component class that can serve as a cell renderer. */
export type CellRendererComponent = Type<unknown>;

/**
 * Maps a CellType literal to the Angular component class that renders it.
 *
 * ReadonlyMap ensures the registry is not mutated after construction.
 * New cell types are registered by extending this map in app.config.ts
 * and registering the new renderer via CELL_RENDERER_REGISTRY.
 */
export type CellRendererRegistry = ReadonlyMap<CellType, CellRendererComponent>;
