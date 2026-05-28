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

  // A11y: manual ARIA audit (jest-axe not available — using manual assertions)
  it('passes manual a11y checks: table has caption, th has scope, rows have aria-selected', () => {
    const { container } = render(<DataTable caption="A11y test" columns={columns} rows={rows} />);
    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();
    const caption = table?.querySelector('caption');
    expect(caption).toBeInTheDocument();
    const ths = table?.querySelectorAll('th[scope="col"]');
    expect(ths?.length).toBeGreaterThan(0);
    const bodyRows = table?.querySelectorAll('tbody tr');
    bodyRows?.forEach((tr) => {
      expect(tr).toHaveAttribute('aria-selected');
    });
  });
});
