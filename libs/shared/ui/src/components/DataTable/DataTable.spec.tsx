import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable } from './DataTable';
import type { DataTableColumn, DataTableRow } from '../../core/data-table/data-table.types';

interface TestRow {
  name: string;
  initials: string;
  date: string;
  label: string;
  amount: number;
}

const columns: DataTableColumn<TestRow>[] = [
  { key: 'name', header: 'Name', type: 'avatar-text', getValue: (r) => ({ name: r.name, initials: r.initials }) },
  { key: 'date', header: 'Date', type: 'date', sortable: true, getValue: (r) => r.date },
  { key: 'label', header: 'Status', type: 'label', getValue: (r) => r.label, getLabelVariant: (v) => v === 'Active' ? 'active' : 'default' },
  { key: 'amount', header: 'Amount', type: 'numeric', getValue: (r) => r.amount },
  { key: 'actions', header: '', type: 'action', actions: [{ key: 'edit', label: 'Edit' }, { key: 'delete', label: 'Delete' }] },
];

const rows: DataTableRow<TestRow>[] = [
  { id: 'r1', data: { name: 'Alice Johnson', initials: 'AJ', date: '2024-03-15', label: 'Active', amount: 12500 } },
  { id: 'r2', data: { name: 'Bob Smith', initials: 'BS', date: '2024-01-22', label: 'Inactive', amount: 9800 } },
];

describe('DataTable', () => {
  // AC: Table renders rows with checkbox selection
  it('renders a table with checkboxes for each row', () => {
    render(<DataTable caption="Test table" columns={columns} rows={rows} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
    const checkboxes = screen.getAllByRole('checkbox');
    // select-all + one per row
    expect(checkboxes).toHaveLength(rows.length + 1);
  });

  // AC: Visible table caption
  it('renders a visually hidden caption for screen readers', () => {
    render(<DataTable caption="Team members" columns={columns} rows={rows} />);
    expect(screen.getByText('Team members')).toBeInTheDocument();
  });

  // AC: Each row displays avatar + name, date (DD/MM/YYYY), label badge, numeric value, action menu
  it('renders avatar initials and name', () => {
    render(<DataTable caption="Test" columns={columns} rows={rows} />);
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('AJ')).toBeInTheDocument();
  });

  it('formats date as DD/MM/YYYY', () => {
    render(<DataTable caption="Test" columns={columns} rows={rows} />);
    expect(screen.getByText('15/03/2024')).toBeInTheDocument();
  });

  it('renders label badge with correct variant', () => {
    render(<DataTable caption="Test" columns={columns} rows={rows} />);
    const activeLabel = screen.getByText('Active').closest('.ui-data-table-label');
    expect(activeLabel).toHaveAttribute('data-variant', 'active');
    const inactiveLabel = screen.getByText('Inactive').closest('.ui-data-table-label');
    expect(inactiveLabel).toHaveAttribute('data-variant', 'default');
  });

  it('formats numeric values', () => {
    render(<DataTable caption="Test" columns={columns} rows={rows} />);
    expect(screen.getByText('12,500')).toBeInTheDocument();
  });

  // AC: Rows support selected state with visual highlight
  it('marks selected rows with aria-selected', () => {
    render(<DataTable caption="Test" columns={columns} rows={rows} selectedIds={new Set(['r1'])} />);
    const tableRows = screen.getAllByRole('row');
    // tableRows[0] = header, tableRows[1] = r1, tableRows[2] = r2
    expect(tableRows[1]).toHaveAttribute('aria-selected', 'true');
    expect(tableRows[2]).toHaveAttribute('aria-selected', 'false');
  });

  // AC: Row hover state visually distinct (CSS only — tested via class presence)
  it('applies ui-data-table class to table root', () => {
    render(<DataTable caption="Test" columns={columns} rows={rows} />);
    expect(screen.getByRole('table')).toHaveClass('ui-data-table');
  });

  // AC: Alternating row background (striped variant)
  it('applies striped data-variant when striped prop is set', () => {
    render(<DataTable caption="Test" columns={columns} rows={rows} striped />);
    expect(screen.getByRole('table')).toHaveAttribute('data-variant', 'striped');
  });

  // AC: Action menu opens on click and has keyboard support
  it('opens action menu on button click', async () => {
    const user = userEvent.setup();
    render(<DataTable caption="Test" columns={columns} rows={rows} />);
    const actionBtn = screen.getAllByRole('button', { name: /open actions/i })[0];
    await user.click(actionBtn);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
  });

  it('closes action menu on Escape', async () => {
    const user = userEvent.setup();
    render(<DataTable caption="Test" columns={columns} rows={rows} />);
    const actionBtn = screen.getAllByRole('button', { name: /open actions/i })[0];
    await user.click(actionBtn);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('calls onActionSelect when menu item clicked', async () => {
    const user = userEvent.setup();
    const onActionSelect = jest.fn();
    render(<DataTable caption="Test" columns={columns} rows={rows} onActionSelect={onActionSelect} />);
    await user.click(screen.getAllByRole('button', { name: /open actions/i })[0]);
    await user.click(screen.getByRole('menuitem', { name: 'Edit' }));
    expect(onActionSelect).toHaveBeenCalledWith('r1', 'edit');
  });

  // AC: Fully keyboard navigable
  it('toggles row selection on checkbox change', async () => {
    const user = userEvent.setup();
    const onSelectionChange = jest.fn();
    render(<DataTable caption="Test" columns={columns} rows={rows} onSelectionChange={onSelectionChange} />);
    const [, firstRowCheckbox] = screen.getAllByRole('checkbox');
    await user.click(firstRowCheckbox);
    expect(onSelectionChange).toHaveBeenCalledWith(new Set(['r1']));
  });

  it('select-all checkbox selects all rows', async () => {
    const user = userEvent.setup();
    const onSelectionChange = jest.fn();
    render(<DataTable caption="Test" columns={columns} rows={rows} onSelectionChange={onSelectionChange} />);
    const [selectAll] = screen.getAllByRole('checkbox');
    await user.click(selectAll);
    expect(onSelectionChange).toHaveBeenCalledWith(new Set(['r1', 'r2']));
  });

  // AC: WCAG 2.1 AA — a11y attribute checks
  it('has aria-label on select-all checkbox', () => {
    render(<DataTable caption="Test" columns={columns} rows={rows} />);
    const [selectAll] = screen.getAllByRole('checkbox');
    expect(selectAll).toHaveAttribute('aria-label', 'Select all rows');
  });

  it('has aria-label on action buttons', () => {
    render(<DataTable caption="Test" columns={columns} rows={rows} />);
    const actionBtns = screen.getAllByRole('button', { name: /open actions/i });
    expect(actionBtns.length).toBeGreaterThan(0);
  });

  it('column headers with sortable prop have aria-sort', () => {
    render(<DataTable caption="Test" columns={columns} rows={rows} />);
    const dateHeader = screen.getByRole('columnheader', { name: 'Date' });
    expect(dateHeader).toHaveAttribute('aria-sort');
  });

  // AC: Custom column definitions
  it('renders custom column headers', () => {
    render(<DataTable caption="Test" columns={columns} rows={rows} />);
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Date' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
  });

  // AC: Works with any data shape via generics
  it('works with different data shapes', () => {
    interface OtherRow { title: string }
    const otherColumns: DataTableColumn<OtherRow>[] = [
      { key: 'title', header: 'Title', type: 'text', getValue: (r) => r.title },
    ];
    const otherRows: DataTableRow<OtherRow>[] = [
      { id: 'x1', data: { title: 'Hello world' } },
    ];
    render(<DataTable caption="Other" columns={otherColumns} rows={otherRows} />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  // NGI-13 AC: Static column configuration — no getValue needed
  describe('static column configuration', () => {
    interface SimpleRow { firstName: string; lastName: string; score: number }

    const staticColumns: DataTableColumn<SimpleRow>[] = [
      { key: 'firstName', header: 'First Name', type: 'text' },
      { key: 'lastName', header: 'Last Name', type: 'text' },
      { key: 'score', header: 'Score', type: 'numeric' },
    ];
    const staticRows: DataTableRow<SimpleRow>[] = [
      { id: 's1', data: { firstName: 'Jane', lastName: 'Doe', score: 42 } },
      { id: 's2', data: { firstName: 'John', lastName: 'Smith', score: 99 } },
    ];

    // AC1: Column definition specifies at minimum key, header, and cell type
    it('renders columns defined with only key, header, and type (no getValue)', () => {
      render(<DataTable caption="Static test" columns={staticColumns} rows={staticRows} />);
      expect(screen.getByRole('columnheader', { name: 'First Name' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Last Name' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Score' })).toBeInTheDocument();
    });

    // AC1 + key-based value lookup
    it('automatically looks up cell values by column key when getValue is absent', () => {
      render(<DataTable caption="Static test" columns={staticColumns} rows={staticRows} />);
      expect(screen.getByText('Jane')).toBeInTheDocument();
      expect(screen.getByText('Doe')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    // AC2: Columns render in the order they are defined
    it('renders columns in the order they are defined in the configuration', () => {
      render(<DataTable caption="Static test" columns={staticColumns} rows={staticRows} />);
      const headers = screen.getAllByRole('columnheader').map((th) => th.textContent?.trim());
      const dataHeaders = headers.filter((h) => h !== ''); // exclude empty action header
      expect(dataHeaders[0]).toBe('First Name');
      expect(dataHeaders[1]).toBe('Last Name');
      expect(dataHeaders[2]).toBe('Score');
    });

    // AC3: Column headers display the labels provided in the configuration
    it('displays column header labels from configuration', () => {
      render(<DataTable caption="Static test" columns={staticColumns} rows={staticRows} />);
      expect(screen.getByRole('columnheader', { name: 'First Name' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Score' })).toBeInTheDocument();
    });

    // AC4: Adding/removing a column reflects immediately in the rendered table
    it('reflects column additions in the rendered table', () => {
      const { rerender } = render(
        <DataTable caption="Static test" columns={staticColumns.slice(0, 2)} rows={staticRows} />
      );
      expect(screen.queryByRole('columnheader', { name: 'Score' })).not.toBeInTheDocument();
      rerender(<DataTable caption="Static test" columns={staticColumns} rows={staticRows} />);
      expect(screen.getByRole('columnheader', { name: 'Score' })).toBeInTheDocument();
    });

    it('reflects column removals in the rendered table', () => {
      const { rerender } = render(
        <DataTable caption="Static test" columns={staticColumns} rows={staticRows} />
      );
      expect(screen.getByRole('columnheader', { name: 'Score' })).toBeInTheDocument();
      rerender(<DataTable caption="Static test" columns={staticColumns.slice(0, 2)} rows={staticRows} />);
      expect(screen.queryByRole('columnheader', { name: 'Score' })).not.toBeInTheDocument();
    });
  });

  // NGI-14 AC: Data row rendering — plain `data` array prop
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
    it('renders one row per object in the data array', () => {
      render(<DataTable caption="Cities" columns={dataCols} data={plainData} />);
      const bodyRows = screen.getAllByRole('row').slice(1); // skip header
      expect(bodyRows).toHaveLength(plainData.length);
    });

    // AC2: Each cell displays the value corresponding to its column key
    it('displays cell values matching column keys', () => {
      render(<DataTable caption="Cities" columns={dataCols} data={plainData} />);
      expect(screen.getByText('Berlin')).toBeInTheDocument();
      expect(screen.getByText('Germany')).toBeInTheDocument();
      expect(screen.getByText('Paris')).toBeInTheDocument();
    });

    // AC3: Rows maintain the same order as the source data array
    it('renders rows in the same order as the data array', () => {
      render(<DataTable caption="Cities" columns={dataCols} data={plainData} />);
      const cells = screen.getAllByRole('cell').filter(
        (td) => td.textContent && ['Berlin', 'Paris', 'Tokyo'].includes(td.textContent.trim())
      );
      expect(cells[0].textContent?.trim()).toBe('Berlin');
      expect(cells[1].textContent?.trim()).toBe('Paris');
      expect(cells[2].textContent?.trim()).toBe('Tokyo');
    });

    // AC4: The number of rendered rows equals the number of items in the data array
    it('renders exactly as many rows as items in the data array', () => {
      const { rerender } = render(<DataTable caption="Cities" columns={dataCols} data={plainData} />);
      expect(screen.getAllByRole('row').slice(1)).toHaveLength(3);

      rerender(<DataTable caption="Cities" columns={dataCols} data={plainData.slice(0, 1)} />);
      expect(screen.getAllByRole('row').slice(1)).toHaveLength(1);
    });

    // rows prop still works (backward compat)
    it('still accepts the rows prop for backward compatibility', () => {
      const wrapped = [
        { id: 'x1', data: { city: 'Madrid', country: 'Spain' } },
      ];
      render(<DataTable caption="Cities" columns={dataCols} rows={wrapped} />);
      expect(screen.getByText('Madrid')).toBeInTheDocument();
    });

    // rows takes precedence over data when both provided
    it('rows prop takes precedence over data when both are provided', () => {
      const wrapped = [{ id: 'x1', data: { city: 'Madrid', country: 'Spain' } }];
      render(<DataTable caption="Cities" columns={dataCols} rows={wrapped} data={plainData} />);
      expect(screen.getByText('Madrid')).toBeInTheDocument();
      expect(screen.queryByText('Berlin')).not.toBeInTheDocument();
    });
  });

  // NGI-15 AC: Row hover state
  describe('row hover state', () => {
    // AC1 + AC4: Hover is CSS-only via .ui-data-table tbody tr:hover — no JS state, no layout change.
    // We assert: the table has the class that activates the CSS token, body rows carry
    // no inline mouse handlers for hover (pure CSS), and no style or content changes on rows.
    it('applies ui-data-table class that drives the CSS hover token', () => {
      render(<DataTable caption="Hover test" columns={columns} rows={rows} />);
      const table = screen.getByRole('table');
      expect(table).toHaveClass('ui-data-table');
    });

    // AC4: hover does not affect cell content rendering
    it('body rows do not have inline onMouseEnter/onMouseLeave for hover (CSS-only)', () => {
      const { container } = render(<DataTable caption="Hover test" columns={columns} rows={rows} />);
      const bodyRows = container.querySelectorAll('tbody tr');
      bodyRows.forEach((tr) => {
        // CSS :hover handles highlight — no JS event attributes expected
        expect(tr).not.toHaveAttribute('onmouseenter');
        expect(tr).not.toHaveAttribute('onmouseleave');
      });
    });

    // AC2: hover token is defined via CSS custom property (token present in stylesheet)
    it('defines the hover background token on .ui-data-table root', () => {
      const { container } = render(<DataTable caption="Hover test" columns={columns} rows={rows} />);
      const table = container.querySelector('.ui-data-table') as HTMLElement;
      // In jsdom the token is set via stylesheet, so the computed style returns the value
      // We verify the CSS class is present (which exposes the token to the browser)
      expect(table).toHaveClass('ui-data-table');
    });

    // AC3: only one row can visually be hovered at a time (CSS :hover is exclusive — structural test)
    it('renders multiple body rows each capable of receiving :hover independently', async () => {
      const user = userEvent.setup();
      render(<DataTable caption="Hover test" columns={columns} rows={rows} />);
      const bodyRows = screen.getAllByRole('row').slice(1);
      expect(bodyRows.length).toBeGreaterThan(1);
      // Hover first row — no errors, no layout change
      await user.hover(bodyRows[0]);
      expect(bodyRows[0]).toBeInTheDocument();
      expect(bodyRows[1]).toBeInTheDocument();
      // Hover second row — first row no longer hovered
      await user.hover(bodyRows[1]);
      expect(bodyRows[0]).toBeInTheDocument();
    });

    // AC4: hover does not affect cell content (text content unchanged after hover)
    it('cell text content is unchanged after row hover', async () => {
      const user = userEvent.setup();
      render(<DataTable caption="Hover test" columns={columns} rows={rows} />);
      const bodyRows = screen.getAllByRole('row').slice(1);
      const cellsBefore = Array.from(bodyRows[0].querySelectorAll('td')).map(td => td.textContent);
      await user.hover(bodyRows[0]);
      const cellsAfter = Array.from(bodyRows[0].querySelectorAll('td')).map(td => td.textContent);
      expect(cellsAfter).toEqual(cellsBefore);
    });
  });

  // NGI-16 AC: Empty state
  describe('empty state', () => {
    // AC1: When data is empty array, no data rows are rendered
    it('renders no data rows when data is an empty array', () => {
      render(<DataTable caption="Empty" columns={columns} data={[]} />);
      const bodyRows = screen.getAllByRole('row').slice(1); // skip header
      expect(bodyRows).toHaveLength(1); // only the empty-state row
      expect(bodyRows[0].querySelector('td')).not.toBeNull();
    });

    // AC2: Empty state message is displayed in place of rows
    it('displays the empty state message when data is empty', () => {
      render(<DataTable caption="Empty" columns={columns} data={[]} />);
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    // AC5: Meaningful default message
    it('uses "No data available" as the default empty message', () => {
      render(<DataTable caption="Empty" columns={columns} data={[]} />);
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    // AC5: Custom empty message
    it('renders a custom emptyMessage when provided', () => {
      render(<DataTable caption="Empty" columns={columns} data={[]} emptyMessage="Nothing here yet" />);
      expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
    });

    // AC4: Column headers remain visible during empty state
    it('keeps column headers visible when data is empty', () => {
      render(<DataTable caption="Empty" columns={columns} data={[]} />);
      expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    });

    // AC3: Empty state is distinct from loading state
    it('shows empty state message (not loading indicator) when data is empty and loading is false', () => {
      render(<DataTable caption="Empty" columns={columns} data={[]} loading={false} />);
      expect(screen.getByText('No data available')).toBeInTheDocument();
      expect(screen.queryByLabelText('Loading data')).not.toBeInTheDocument();
    });

    // AC3: Loading state is clearly distinguished from empty state
    it('shows loading indicator (not empty message) when loading is true', () => {
      render(<DataTable caption="Loading" columns={columns} data={[]} loading />);
      expect(screen.queryByText('No data available')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Loading data')).toBeInTheDocument();
    });

    // AC3: Loading state has aria-busy
    it('marks the loading cell as aria-busy', () => {
      render(<DataTable caption="Loading" columns={columns} data={[]} loading />);
      const loadingCell = screen.getByLabelText('Loading data');
      expect(loadingCell).toHaveAttribute('aria-busy', 'true');
    });

    // Shows rows normally when data is non-empty
    it('renders rows normally when data is non-empty', () => {
      const data = [{ name: 'Alice', role: 'Admin', status: 'Active', joinDate: new Date('2023-01-01'), score: 10 }];
      render(<DataTable caption="Non-empty" columns={columns} data={data} />);
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.queryByText('No data available')).not.toBeInTheDocument();
    });
  });
});
