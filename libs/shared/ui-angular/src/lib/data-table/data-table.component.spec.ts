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

  it('passes the axe accessibility audit', async () => {
    const { container } = await setup();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
