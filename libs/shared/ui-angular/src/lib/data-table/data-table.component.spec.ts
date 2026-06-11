import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import { DataTableComponent } from './data-table.component';
import type { DataTableColumn, DataTableRow } from '@test-project/shared-ui';

expect.extend(toHaveNoViolations);

interface TestRow {
  name: string;
  initials: string;
  description: string;
  date: string;
  label: string;
  amount: number;
}

const columns: DataTableColumn<TestRow>[] = [
  {
    key: 'name',
    header: 'Name',
    type: 'avatar-text',
    getValue: (row) => ({ name: row.name, initials: row.initials }),
  },
  {
    key: 'description',
    header: 'Description',
    type: 'text',
    getValue: (row) => row.description,
  },
  {
    key: 'date',
    header: 'Date',
    type: 'date',
    sortable: true,
    getValue: (row) => row.date,
  },
  {
    key: 'label',
    header: 'Status',
    type: 'label',
    getValue: (row) => row.label,
    getLabelVariant: (value) => (value === 'Active' ? 'active' : 'default'),
  },
  {
    key: 'amount',
    header: 'Amount',
    type: 'numeric',
    sortable: true,
    getValue: (row) => row.amount,
  },
  {
    key: 'actions',
    header: '',
    type: 'action',
    actions: [
      { key: 'edit', label: 'Edit' },
      { key: 'delete', label: 'Delete' },
    ],
  },
];

const rows: DataTableRow<TestRow>[] = [
  {
    id: 'r1',
    data: {
      name: 'Alice Johnson',
      initials: 'AJ',
      description: 'Product manager',
      date: '2024-03-15',
      label: 'Active',
      amount: 12500,
    },
  },
  {
    id: 'r2',
    data: {
      name: 'Bob Smith',
      initials: 'BS',
      description: 'Engineer',
      date: '2024-01-22',
      label: 'Inactive',
      amount: 9800,
    },
  },
];

async function setup(inputs: Partial<DataTableComponent<TestRow>> = {}) {
  return render(DataTableComponent, {
    componentInputs: {
      caption: 'Team members',
      columns,
      rows,
      selectable: true,
      ...inputs,
    },
  });
}

describe('DataTableComponent', () => {
  it('renders a table with a select-all checkbox and one checkbox per row', async () => {
    await setup();

    expect(screen.getByRole('table')).toBeTruthy();
    expect(screen.getAllByRole('checkbox')).toHaveLength(rows.length + 1);
  });

  it('renders avatar, text, date, label, numeric content, and row action triggers', async () => {
    await setup();

    expect(screen.getByText('Alice Johnson')).toBeTruthy();
    expect(screen.getByText('AJ')).toBeTruthy();
    expect(screen.getByText('Product manager')).toBeTruthy();
    expect(screen.getByText('15/03/2024')).toBeTruthy();
    expect(screen.getByText('Active')).toBeTruthy();
    expect(screen.getByText('12,500')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open actions for Alice Johnson' })).toBeTruthy();
  });

  it('applies aria-selected to selected rows', async () => {
    await setup({ selectedIds: new Set(['r1']) });

    const bodyRows = screen.getAllByRole('row').slice(1);
    expect(bodyRows[0]?.getAttribute('aria-selected')).toBe('true');
    expect(bodyRows[1]?.getAttribute('aria-selected')).toBe('false');
  });

  it('applies the shared ui-data-table class for hover and focus styling hooks', async () => {
    await setup();

    expect(screen.getByRole('table').classList.contains('ui-data-table')).toBe(true);
  });

  it('marks striped tables with the striped variant attribute', async () => {
    await setup({ striped: true });

    expect(screen.getByRole('table').getAttribute('data-variant')).toBe('striped');
  });

  it('opens the action menu on click and supports keyboard dismissal/navigation', async () => {
    const user = userEvent.setup();
    await setup();

    await user.click(screen.getByRole('button', { name: 'Open actions for Alice Johnson' }));
    expect(screen.getByRole('menu', { name: 'Actions for Alice Johnson' })).toBeTruthy();

    await user.keyboard('{ArrowDown}');
    expect((document.activeElement as HTMLElement | null)?.textContent).toContain('Delete');

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu', { name: 'Actions for Alice Johnson' })).toBeNull();
  });

  it('is keyboard navigable: first tab stop is the select-all checkbox', async () => {
    const user = userEvent.setup();
    await setup();

    await user.tab();
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Select all rows');
  });

  it('toggles row selection when checkbox is clicked', async () => {
    const user = userEvent.setup();
    await setup();

    await user.click(screen.getByRole('checkbox', { name: 'Select Alice Johnson' }));

    const bodyRows = screen.getAllByRole('row').slice(1);
    expect(bodyRows[0]?.getAttribute('aria-selected')).toBe('true');
  });

  it('renders sortable custom column headers', async () => {
    await setup();

    expect(screen.getByRole('columnheader', { name: 'Date' }).getAttribute('aria-sort')).toBe('none');
    expect(screen.getByRole('columnheader', { name: 'Amount' }).getAttribute('aria-sort')).toBe('none');
  });

  it('supports custom column definitions', async () => {
    await setup();

    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'Description' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeTruthy();
  });

  it('works with different row shapes via generics', async () => {
    interface OtherRow {
      title: string;
    }

    const otherColumns: DataTableColumn<OtherRow>[] = [
      {
        key: 'title',
        header: 'Title',
        type: 'text',
        getValue: (row) => row.title,
      },
    ];
    const otherRows: DataTableRow<OtherRow>[] = [{ id: 'x1', data: { title: 'Hello world' } }];

    await render(DataTableComponent, {
      componentInputs: {
        caption: 'Other rows',
        columns: otherColumns,
        rows: otherRows,
      },
    });

    expect(screen.getByText('Hello world')).toBeTruthy();
  });

  // NGI-13 AC: Static column configuration — no getValue needed
  describe('static column configuration', () => {
    interface SimpleRow { city: string; country: string; population: number }

    const staticColumns: DataTableColumn<SimpleRow>[] = [
      { key: 'city', header: 'City', type: 'text' },
      { key: 'country', header: 'Country', type: 'text' },
      { key: 'population', header: 'Population', type: 'numeric' },
    ];
    const staticRows: DataTableRow<SimpleRow>[] = [
      { id: 'c1', data: { city: 'Berlin', country: 'Germany', population: 3645000 } },
      { id: 'c2', data: { city: 'Paris', country: 'France', population: 2161000 } },
    ];

    // AC1: Column definition specifies at minimum key, header, and cell type
    it('renders columns defined with only key, header, and type (no getValue)', async () => {
      await render(DataTableComponent, {
        componentInputs: { caption: 'Cities', columns: staticColumns, rows: staticRows },
      });
      expect(screen.getByRole('columnheader', { name: 'City' })).toBeTruthy();
      expect(screen.getByRole('columnheader', { name: 'Country' })).toBeTruthy();
      expect(screen.getByRole('columnheader', { name: 'Population' })).toBeTruthy();
    });

    // AC1 + key-based value lookup
    it('automatically looks up cell values by column key when getValue is absent', async () => {
      await render(DataTableComponent, {
        componentInputs: { caption: 'Cities', columns: staticColumns, rows: staticRows },
      });
      expect(screen.getByText('Berlin')).toBeTruthy();
      expect(screen.getByText('Germany')).toBeTruthy();
      expect(screen.getByText('3,645,000')).toBeTruthy();
    });

    // AC2: Columns render in the order they are defined
    it('renders columns in the order they are defined in the configuration', async () => {
      await render(DataTableComponent, {
        componentInputs: { caption: 'Cities', columns: staticColumns, rows: staticRows, selectable: false },
      });
      const headers = screen.getAllByRole('columnheader').map((th) => th.textContent?.trim());
      expect(headers[0]).toBe('City');
      expect(headers[1]).toBe('Country');
      expect(headers[2]).toBe('Population');
    });

    // AC3: Column headers display the labels provided in the configuration
    it('displays column header labels from configuration', async () => {
      await render(DataTableComponent, {
        componentInputs: { caption: 'Cities', columns: staticColumns, rows: staticRows },
      });
      expect(screen.getByRole('columnheader', { name: 'City' })).toBeTruthy();
      expect(screen.getByRole('columnheader', { name: 'Population' })).toBeTruthy();
    });
  });

  it('passes the axe accessibility audit', async () => {
    const { container } = await setup();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  // NGI-14 AC: Data row rendering — plain `data` array input
  describe('data row rendering', () => {
    interface PlainRow { city: string; country: string }

    const dataCols: DataTableColumn<PlainRow>[] = [
      { key: 'city', header: 'City', type: 'text' },
      { key: 'country', header: 'Country', type: 'text' },
    ];
    const plainData: PlainRow[] = [
      { city: 'Berlin', country: 'Germany' },
      { city: 'Paris', country: 'France' },
      { city: 'Tokyo', country: 'Japan' },
    ];

    // AC1: Each object in the data array is rendered as one table row
    it('renders one row per object in the data array', async () => {
      await render(DataTableComponent, {
        componentInputs: { caption: 'Cities', columns: dataCols, data: plainData, selectable: false },
      });
      const bodyRows = screen.getAllByRole('row').slice(1);
      expect(bodyRows).toHaveLength(plainData.length);
    });

    // AC2: Each cell displays the value corresponding to its column key
    it('displays cell values matching column keys', async () => {
      await render(DataTableComponent, {
        componentInputs: { caption: 'Cities', columns: dataCols, data: plainData },
      });
      expect(screen.getByText('Berlin')).toBeTruthy();
      expect(screen.getByText('Germany')).toBeTruthy();
      expect(screen.getByText('Paris')).toBeTruthy();
    });

    // AC3: Rows maintain the same order as the source data array
    it('renders rows in the same order as the data array', async () => {
      await render(DataTableComponent, {
        componentInputs: { caption: 'Cities', columns: dataCols, data: plainData, selectable: false },
      });
      const cityHeader = screen.getByRole('columnheader', { name: 'City' });
      const colIndex = Array.from(cityHeader.parentElement!.children).indexOf(cityHeader);
      const bodyCells = screen.getAllByRole('row').slice(1).map(
        (row) => (row.children[colIndex] as HTMLElement).textContent?.trim()
      );
      expect(bodyCells).toEqual(['Berlin', 'Paris', 'Tokyo']);
    });

    // AC4: Number of rendered rows equals number of items in data array
    it('renders exactly as many rows as items in the data array', async () => {
      await render(DataTableComponent, {
        componentInputs: { caption: 'Cities', columns: dataCols, data: plainData, selectable: false },
      });
      expect(screen.getAllByRole('row').slice(1)).toHaveLength(3);
    });

    // backward compat: rows input still works
    it('still accepts the rows input for backward compatibility', async () => {
      const wrapped = [{ id: 'x1', data: { city: 'Madrid', country: 'Spain' } }];
      await render(DataTableComponent, {
        componentInputs: { caption: 'Cities', columns: dataCols, rows: wrapped },
      });
      expect(screen.getByText('Madrid')).toBeTruthy();
    });
  });

  // NGI-15 AC: Row hover state
  describe('row hover state', () => {
    // AC1+AC4: hover is CSS-only — table carries the class that activates the token
    it('applies ui-data-table class that drives the CSS hover token', async () => {
      await setup();
      expect(screen.getByRole('table').classList.contains('ui-data-table')).toBe(true);
    });

    // AC4: no inline Angular event bindings for hover on <tr> (pure CSS)
    it('body rows do not have mouseenter/mouseleave attributes for hover (CSS-only)', async () => {
      const { container } = await setup();
      const bodyRows = container.querySelectorAll('tbody tr');
      bodyRows.forEach((tr) => {
        expect(tr.hasAttribute('onmouseenter')).toBe(false);
        expect(tr.hasAttribute('onmouseleave')).toBe(false);
      });
    });

    // AC3: multiple rows rendered — only the one under cursor can receive :hover (CSS exclusive)
    it('renders multiple rows each structurally capable of independent hover', async () => {
      await setup();
      const bodyRows = screen.getAllByRole('row').slice(1);
      expect(bodyRows.length).toBeGreaterThan(1);
    });

    // AC4: hover does not affect cell content
    it('cell text is unchanged after hovering a row', async () => {
      const user = userEvent.setup();
      const { container } = await setup();
      const firstRow = container.querySelector('tbody tr') as HTMLElement;
      const cellsBefore = Array.from(firstRow.querySelectorAll('td')).map(td => td.textContent);
      await user.hover(firstRow);
      const cellsAfter = Array.from(firstRow.querySelectorAll('td')).map(td => td.textContent);
      expect(cellsAfter).toEqual(cellsBefore);
    });

    it('passes the axe accessibility audit with hover-ready structure', async () => {
      const { container } = await setup();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  // NGI-16 AC: Empty state
  describe('empty state', () => {
    // AC1: No data rows when data is empty
    it('renders no data rows when data is an empty array', async () => {
      await render(DataTableComponent, {
        componentInputs: { caption: 'Empty', columns, data: [] },
      });
      const bodyRows = screen.getAllByRole('row').slice(1);
      expect(bodyRows).toHaveLength(1); // only empty-state row
    });

    // AC2: Empty state message displayed
    it('displays the default empty message when data is empty', async () => {
      await render(DataTableComponent, {
        componentInputs: { caption: 'Empty', columns, data: [] },
      });
      expect(screen.getByText('No data available')).toBeTruthy();
    });

    // AC5: Custom message
    it('renders a custom emptyMessage when provided', async () => {
      await render(DataTableComponent, {
        componentInputs: { caption: 'Empty', columns, data: [], emptyMessage: 'Nothing here yet' },
      });
      expect(screen.getByText('Nothing here yet')).toBeTruthy();
    });

    // AC4: Column headers remain visible
    it('keeps column headers visible when data is empty', async () => {
      await render(DataTableComponent, {
        componentInputs: { caption: 'Empty', columns, data: [] },
      });
      expect(screen.getByRole('columnheader', { name: 'Name' })).toBeTruthy();
    });

    // AC3: Empty vs loading — empty shows message, not spinner
    it('shows empty message (not loading indicator) when data is empty and loading is false', async () => {
      await render(DataTableComponent, {
        componentInputs: { caption: 'Empty', columns, data: [], loading: false },
      });
      expect(screen.getByText('No data available')).toBeTruthy();
      expect(screen.queryByLabelText('Loading data')).toBeNull();
    });

    // AC3: Loading state distinct from empty state
    it('shows loading indicator (not empty message) when loading is true', async () => {
      await render(DataTableComponent, {
        componentInputs: { caption: 'Loading', columns, data: [], loading: true },
      });
      expect(screen.queryByText('No data available')).toBeNull();
      expect(screen.getByLabelText('Loading data')).toBeTruthy();
    });

    // AC3: Loading cell is aria-busy
    it('marks the loading cell as aria-busy', async () => {
      const { container } = await render(DataTableComponent, {
        componentInputs: { caption: 'Loading', columns, data: [], loading: true },
      });
      const loadingCell = container.querySelector('[aria-busy="true"]');
      expect(loadingCell).not.toBeNull();
    });

    // Rows render normally when data is non-empty
    it('renders data rows normally when data is non-empty', async () => {
      const data = [{ name: 'Alice', initials: 'AL', description: 'Admin', date: '2023-01-01', label: 'Active', amount: 10 }];
      await render(DataTableComponent, {
        componentInputs: { caption: 'Non-empty', columns, data },
      });
      expect(screen.getByText('Alice')).toBeTruthy();
      expect(screen.queryByText('No data available')).toBeNull();
    });

    it('passes the axe accessibility audit on empty state', async () => {
      const { container } = await render(DataTableComponent, {
        componentInputs: { caption: 'Empty a11y', columns, data: [] },
      });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
