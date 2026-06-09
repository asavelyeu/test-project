import type { Meta, StoryObj } from '@storybook/react';
import { DataTable } from './DataTable';
import type { DataTableColumn, DataTableProps, DataTableRow } from '../../core/data-table/data-table.types';

interface SampleRow {
  name: string;
  avatarInitials: string;
  description: string;
  date: string;
  label: string;
  amount: number;
}

const columns: DataTableColumn<SampleRow>[] = [
  {
    key: 'name',
    header: 'Name',
    type: 'avatar-text',
    getValue: (row) => ({ name: row.name, initials: row.avatarInitials }),
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
    getLabelVariant: (val) => (val === 'Active' ? 'active' : 'default'),
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

const rows: DataTableRow<SampleRow>[] = [
  { id: '1', data: { name: 'Alice Johnson', avatarInitials: 'AJ', description: 'Product manager', date: '2024-03-15', label: 'Active', amount: 12500 } },
  { id: '2', data: { name: 'Bob Smith', avatarInitials: 'BS', description: 'Engineer', date: '2024-01-22', label: 'Inactive', amount: 9800 } },
  { id: '3', data: { name: 'Carol White', avatarInitials: 'CW', description: 'Designer', date: '2024-06-01', label: 'Active', amount: 11200 } },
  { id: '4', data: { name: 'David Lee', avatarInitials: 'DL', description: 'Analyst', date: '2023-11-30', label: 'Inactive', amount: 7400 } },
];

const meta: Meta<DataTableProps<SampleRow>> = {
  title: 'Shared/DataTable',
  component: DataTable,
  tags: ['autodocs'],
  argTypes: {
    striped: { control: 'boolean', description: 'Enable alternating row backgrounds' },
    caption: { control: 'text', description: 'Accessible table caption (screen-reader only)' },
  },
};

export default meta;
type Story = StoryObj<DataTableProps<SampleRow>>;

export const Default: Story = {
  args: {
    caption: 'Team members',
    columns,
    rows,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h3 style={{ marginBottom: '8px', fontSize: '14px', color: '#374151' }}>Default</h3>
        <DataTable caption="Default variant" columns={columns} rows={rows} />
      </div>
      <div>
        <h3 style={{ marginBottom: '8px', fontSize: '14px', color: '#374151' }}>Striped</h3>
        <DataTable caption="Striped variant" columns={columns} rows={rows} striped />
      </div>
    </div>
  ),
};

export const AllStates: Story = {
  render: () => (
    <DataTable
      caption="Table with mixed selection states"
      columns={columns}
      rows={rows}
      selectedIds={new Set(['1', '3'])}
    />
  ),
};

export const TailwindTheme: Story = {
  render: () => (
    <DataTable
      caption="Custom Tailwind theme"
      columns={columns}
      rows={rows}
      className="[--ui-data-table-checkbox-checked-bg:theme(colors.emerald.600)] [--ui-data-table-row-bg-selected:theme(colors.emerald.50)] [--ui-data-table-avatar-bg:theme(colors.emerald.100)] [--ui-data-table-avatar-text:theme(colors.emerald.700)]"
    />
  ),
};

export const CssTheme: Story = {
  render: () => (
    <>
      <style>{`
        .custom-blue-theme {
          --ui-data-table-checkbox-checked-bg: #1d4ed8;
          --ui-data-table-row-bg-selected: #eff6ff;
          --ui-data-table-avatar-bg: #dbeafe;
          --ui-data-table-avatar-text: #1d4ed8;
          --ui-data-table-label-bg-active: #dbeafe;
          --ui-data-table-label-text-active: #1e40af;
        }
      `}</style>
      <DataTable
        caption="Custom CSS theme (blue)"
        columns={columns}
        rows={rows}
        className="custom-blue-theme"
      />
    </>
  ),
};

export const A11yShowcase: Story = {
  render: () => (
    <div>
      <p style={{ marginBottom: '16px', fontSize: '14px', color: '#6B7280' }}>
        <strong>Keyboard navigation:</strong> Tab to reach checkboxes and action buttons.
        Space to toggle row selection. Enter/Space on sortable column headers to sort.
        Click the three-dot menu, then use Arrow keys to navigate items, Escape to close.
      </p>
      <DataTable
        caption="Accessible team members table — keyboard and screen reader ready"
        columns={columns}
        rows={rows}
      />
    </div>
  ),
};

interface ProductRow {
  id: string;
  name: string;
  category: string;
  price: number;
}

const staticProductColumns: DataTableColumn<ProductRow>[] = [
  { key: 'id', header: 'ID', type: 'text' },
  { key: 'name', header: 'Product Name', type: 'text' },
  { key: 'category', header: 'Category', type: 'text' },
  { key: 'price', header: 'Price', type: 'numeric' },
];

const staticProductRows: DataTableRow<ProductRow>[] = [
  { id: 'p1', data: { id: 'SKU-001', name: 'Wireless Keyboard', category: 'Electronics', price: 79 } },
  { id: 'p2', data: { id: 'SKU-002', name: 'USB-C Hub', category: 'Electronics', price: 49 } },
  { id: 'p3', data: { id: 'SKU-003', name: 'Desk Lamp', category: 'Office', price: 34 } },
];

/** NGI-13: Static column configuration — columns defined with key, header, and type only.
 *  No `getValue` getter required; values are resolved automatically by column key. */
export const StaticColumns: StoryObj<DataTableProps<ProductRow>> = {
  render: () => (
    <div>
      <p style={{ marginBottom: '16px', fontSize: '14px', color: '#6B7280' }}>
        <strong>Static column config:</strong> Each column is defined with only{' '}
        <code>key</code>, <code>header</code>, and <code>type</code> — no custom{' '}
        <code>getValue</code> getter. Cell values are resolved automatically from{' '}
        <code>row.data[column.key]</code>.
      </p>
      <DataTable caption="Products" columns={staticProductColumns} rows={staticProductRows} />
    </div>
  ),
};
