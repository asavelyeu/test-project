import React from 'react';
import { render } from '@testing-library/react';

import type { ColumnConfig } from '@test-project/data-table';
import { DataTable } from './data-table';

// ---------------------------------------------------------------------------
// Fixtures — two structurally different dataset shapes; no domain type imports.
// All field names are generic (title/score, label/amount) — no Student, User, etc.
// ---------------------------------------------------------------------------

interface ShapeA {
  title: string;
  score: number;
}

interface ShapeB {
  label: string;
  amount: string;
}

const columnsA: readonly ColumnConfig<ShapeA>[] = [
  { id: 'title', key: 'title', header: 'Title', type: 'text' },
  { id: 'score', key: 'score', header: 'Score', type: 'text' },
];

const dataA: readonly ShapeA[] = [
  { title: 'Alpha', score: 10 },
  { title: 'Beta', score: 20 },
];

const columnsB: readonly ColumnConfig<ShapeB>[] = [
  { id: 'label', key: 'label', header: 'Label', type: 'text' },
  { id: 'amount', key: 'amount', header: 'Amount', type: 'text', align: 'end' },
];

const dataB: readonly ShapeB[] = [
  { label: 'Gamma', amount: '$100' },
  { label: 'Delta', amount: '$200' },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DataTable', () => {
  // 1. Two structurally different dataset shapes render correctly.
  it('US-01/US-03: renders rows and cells for ShapeA dataset', () => {
    const { getByText } = render(<DataTable columns={columnsA} data={dataA} />);
    expect(getByText('Title')).toBeTruthy();
    expect(getByText('Score')).toBeTruthy();
    expect(getByText('Alpha')).toBeTruthy();
    expect(getByText('20')).toBeTruthy();
  });

  it('US-01/US-08: renders rows and cells for ShapeB dataset (domain-agnostic)', () => {
    const { getByText } = render(<DataTable columns={columnsB} data={dataB} />);
    expect(getByText('Label')).toBeTruthy();
    expect(getByText('Amount')).toBeTruthy();
    expect(getByText('Gamma')).toBeTruthy();
    expect(getByText('$200')).toBeTruthy();
  });

  // 2. Prop-change re-render reflects new data.
  it('US-01: re-renders with updated data when props change', () => {
    const { getByText, queryByText, rerender } = render(
      <DataTable columns={columnsA} data={dataA} />,
    );

    expect(getByText('Alpha')).toBeTruthy();
    expect(queryByText('Zeta')).toBeNull();

    const updatedData: readonly ShapeA[] = [{ title: 'Zeta', score: 99 }];
    rerender(<DataTable columns={columnsA} data={updatedData} />);

    expect(queryByText('Alpha')).toBeNull();
    expect(getByText('Zeta')).toBeTruthy();
    expect(getByText('99')).toBeTruthy();
  });

  // 3. Unknown cell type in dev → throws containing expected message.
  it('US-01: throws for unknown cell type in development', () => {
    const unknownColumns = [
      { id: 'x', key: 'title', header: 'X', type: 'unknown-type' },
    ] as unknown as readonly ColumnConfig<ShapeA>[];

    // Suppress the React error boundary console.error noise in this test.
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() =>
      render(<DataTable columns={unknownColumns} data={dataA} />),
    ).toThrow('No renderer registered for cell type "unknown-type"');

    consoleSpy.mockRestore();
  });

  // 4. column.align applied as textAlign style when present.
  it('US-02: applies textAlign style to <th> and <td> when column.align is set', () => {
    const { container } = render(<DataTable columns={columnsB} data={dataB} />);

    // 'amount' column has align: 'end' → expect textAlign: right on th and td.
    const headers = container.querySelectorAll('th');
    const amountHeader = Array.from(headers).find(
      (th) => th.textContent === 'Amount',
    );
    expect(amountHeader?.style.textAlign).toBe('right');

    // Find the td cells in the amount column (second td of each row).
    const rows = container.querySelectorAll('tbody tr');
    rows.forEach((row) => {
      const tds = row.querySelectorAll('td');
      expect(tds[1]?.style.textAlign).toBe('right');
    });
  });

  // 5. No <button>, [role=checkbox], or <input> in rendered DOM.
  it('US-08: renders no interactive controls (Actions Cell / Selection Cell absent)', () => {
    const { container } = render(<DataTable columns={columnsA} data={dataA} />);
    expect(container.querySelector('button')).toBeNull();
    expect(container.querySelector('[role="checkbox"]')).toBeNull();
    expect(container.querySelector('input')).toBeNull();
  });

  // 6. Text Cell renders value as text through the Text primitive.
  it('US-09: Text Cell renders value as text inside a <span> from the Text primitive', () => {
    const { container } = render(<DataTable columns={columnsA} data={[{ title: 'Epsilon', score: 7 }]} />);
    const spans = container.querySelectorAll('span');
    const texts = Array.from(spans).map((s) => s.textContent);
    expect(texts).toContain('Epsilon');
    expect(texts).toContain('7');
  });

  // Structural semantics — correct HTML table elements used.
  it('US-03: uses native table semantics (table, thead, tbody, tr, th, td)', () => {
    const { container } = render(<DataTable columns={columnsA} data={dataA} />);
    expect(container.querySelector('table')).toBeTruthy();
    expect(container.querySelector('thead')).toBeTruthy();
    expect(container.querySelector('tbody')).toBeTruthy();
    expect(container.querySelectorAll('th').length).toBe(columnsA.length);
    // Two rows × two columns = four <td> elements.
    expect(container.querySelectorAll('td').length).toBe(dataA.length * columnsA.length);
  });

  // Row count matches data length.
  it('US-03: renders exactly one row per data item', () => {
    const { container } = render(<DataTable columns={columnsA} data={dataA} />);
    expect(container.querySelectorAll('tbody tr').length).toBe(dataA.length);
  });
});
