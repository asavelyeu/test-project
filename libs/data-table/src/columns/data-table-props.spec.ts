/**
 * Unit tests for the DataTableProps contract.
 *
 * Test environment: node (Jest / ts-jest, no DOM).
 * No framework imports. No domain types.
 *
 * US coverage:
 *   US-01 — Configure Table via columns and data props
 *   US-05 — Empty state (emptyStateMessage prop present)
 *   US-06 — Loading state (isLoading prop present)
 *   US-08 — Domain-agnostic reusable structure
 */

import type { DataTableProps } from './data-table-props';
import type { ColumnConfig } from './column-config';

// ---------------------------------------------------------------------------
// Generic row shapes — two structurally different shapes per US-01
// ---------------------------------------------------------------------------

interface ShapeA {
  id: string;
  name: string;
}

interface ShapeB {
  ref: string;
  value: number;
}

// ---------------------------------------------------------------------------
// DataTableProps — structural shape
// ---------------------------------------------------------------------------

describe('DataTableProps', () => {
  it('US-01: requires columns and data; all other fields are optional', () => {
    const props: DataTableProps<ShapeA> = {
      columns: [{ type: 'text', key: 'name', header: 'Name' }],
      data: [{ id: '1', name: 'Alpha' }],
    };

    expect(props.columns).toHaveLength(1);
    expect(props.data).toHaveLength(1);
    expect(props.isLoading).toBeUndefined();
    expect(props.error).toBeUndefined();
    expect(props.emptyStateMessage).toBeUndefined();
  });

  it('US-06: isLoading prop is accepted and defaults to undefined', () => {
    const loading: DataTableProps<ShapeA> = {
      columns: [],
      data: [],
      isLoading: true,
    };
    expect(loading.isLoading).toBe(true);

    const notLoading: DataTableProps<ShapeA> = {
      columns: [],
      data: [],
      isLoading: false,
    };
    expect(notLoading.isLoading).toBe(false);
  });

  it('US-06: isLoading false is distinct from undefined', () => {
    const explicit: DataTableProps<ShapeA> = {
      columns: [],
      data: [],
      isLoading: false,
    };
    const implicit: DataTableProps<ShapeA> = {
      columns: [],
      data: [],
    };
    // false !== undefined — consumers must check with ?? or explicit equality
    expect(explicit.isLoading).toBe(false);
    expect(implicit.isLoading).toBeUndefined();
  });

  it('US-05: emptyStateMessage prop is accepted', () => {
    const props: DataTableProps<ShapeA> = {
      columns: [],
      data: [],
      emptyStateMessage: 'No data available',
    };
    expect(props.emptyStateMessage).toBe('No data available');
  });

  it('error prop is typed unknown — accepts any value without domain constraint', () => {
    const withError: DataTableProps<ShapeA> = {
      columns: [],
      data: [],
      error: new Error('Network timeout'),
    };
    expect(withError.error).toBeInstanceOf(Error);

    const withStringError: DataTableProps<ShapeA> = {
      columns: [],
      data: [],
      error: 'Something went wrong',
    };
    expect(typeof withStringError.error).toBe('string');
  });

  it('US-01: columns and data are readonly — structural immutability', () => {
    const col: ColumnConfig<ShapeA> = { type: 'text', key: 'name', header: 'Name' };
    const row: ShapeA = { id: '1', name: 'Alpha' };
    const props: DataTableProps<ShapeA> = {
      columns: [col],
      data: [row],
    };
    // Readonly arrays: TypeScript prevents push/pop at compile time.
    // At runtime we verify the values are accessible as expected.
    expect(props.columns[0]).toBe(col);
    expect(props.data[0]).toBe(row);
  });

  it('US-01: data array may be empty', () => {
    const props: DataTableProps<ShapeA> = {
      columns: [{ type: 'text', key: 'name', header: 'Name' }],
      data: [],
    };
    expect(props.data).toHaveLength(0);
  });

  it('US-08: DataTableProps works identically for two different row shapes', () => {
    // US-08 requires the same component to handle different datasets
    // without internal changes. This test is the type-level evidence.
    const propsA: DataTableProps<ShapeA> = {
      columns: [{ type: 'text', key: 'name', header: 'Name' }],
      data: [{ id: '1', name: 'Alpha' }],
    };
    const propsB: DataTableProps<ShapeB> = {
      columns: [{ type: 'text', key: 'ref', header: 'Reference' }],
      data: [{ ref: 'R001', value: 42 }],
    };

    expect(propsA.data[0]?.name).toBe('Alpha');
    expect(propsB.data[0]?.ref).toBe('R001');
  });

  it('US-08: no domain-specific field names exist on the props interface', () => {
    const props: DataTableProps<ShapeA> = {
      columns: [],
      data: [],
      isLoading: false,
      error: undefined,
      emptyStateMessage: 'empty',
    };
    const allowedKeys = new Set([
      'columns',
      'data',
      'isLoading',
      'error',
      'emptyStateMessage',
    ]);
    for (const field of Object.keys(props)) {
      expect(allowedKeys.has(field)).toBe(true);
    }
  });
});
