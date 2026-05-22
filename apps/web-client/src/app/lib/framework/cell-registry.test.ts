import { renderToStaticMarkup } from 'react-dom/server';

import type { ColumnConfig } from '@test-project/data-table';
import { renderCell } from './cell-registry';

// ---------------------------------------------------------------------------
// Fixtures — no domain types; structurally distinct shapes only.
// ---------------------------------------------------------------------------

interface RowShapeA {
  title: string;
  count: number;
}

interface RowShapeB {
  label: string;
  active: boolean;
}

const textColumnA: ColumnConfig<RowShapeA> = {
  id: 'title',
  key: 'title',
  header: 'Title',
  type: 'text',
};

const rowA: RowShapeA = { title: 'Alpha', count: 1 };
const rowB: RowShapeB = { label: 'Beta', active: true };

const textColumnB: ColumnConfig<RowShapeB> = {
  id: 'label',
  key: 'label',
  header: 'Label',
  type: 'text',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('renderCell (cell-registry)', () => {
  it('US-09: dispatches "text" type to TextCell and renders the value', () => {
    const element = renderCell(textColumnA, rowA);
    const markup = renderToStaticMarkup(element);
    expect(markup).toContain('Alpha');
  });

  it('US-09: works for a second structurally different row shape', () => {
    const element = renderCell(textColumnB, rowB);
    const markup = renderToStaticMarkup(element);
    expect(markup).toContain('Beta');
  });

  it('US-01: throws in development for an unknown cell type', () => {
    // Cast to bypass TS — simulates a runtime extension gap.
    const unknownColumn = {
      id: 'x',
      key: 'title',
      header: 'X',
      type: 'unknown-type',
    } as unknown as ColumnConfig<RowShapeA>;

    expect(() => renderCell(unknownColumn, rowA)).toThrow(
      'No renderer registered for cell type "unknown-type"',
    );
  });
});
