import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { DataTableComponent } from './data-table.component';
import type { DataTableColumn, DataTableRow } from '@test-project/shared-ui';

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

const rows: DataTableRow<SampleRow>[] = [
  {
    id: '1',
    data: {
      name: 'Alice Johnson',
      avatarInitials: 'AJ',
      description: 'Product manager',
      date: '2024-03-15',
      label: 'Active',
      amount: 12500,
    },
  },
  {
    id: '2',
    data: {
      name: 'Bob Smith',
      avatarInitials: 'BS',
      description: 'Engineer',
      date: '2024-01-22',
      label: 'Inactive',
      amount: 9800,
    },
  },
  {
    id: '3',
    data: {
      name: 'Carol White',
      avatarInitials: 'CW',
      description: 'Designer',
      date: '2024-06-01',
      label: 'Active',
      amount: 11200,
    },
  },
  {
    id: '4',
    data: {
      name: 'David Lee',
      avatarInitials: 'DL',
      description: 'Analyst',
      date: '2023-11-30',
      label: 'Inactive',
      amount: 7400,
    },
  },
];

const baseArgs = {
  caption: 'Team members',
  columns,
  rows,
  selectable: true,
  striped: false,
};

const meta: Meta<DataTableComponent<SampleRow>> = {
  title: 'Shared/DataTable/Angular',
  component: DataTableComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [DataTableComponent] })],
  argTypes: {
    caption: { control: 'text', description: 'Accessible table caption (screen-reader only)' },
    striped: { control: 'boolean', description: 'Enable alternating row backgrounds' },
    selectable: { control: 'boolean', description: 'Show checkbox selection column' },
  },
  args: baseArgs,
};

export default meta;

type Story = StoryObj<DataTableComponent<SampleRow>>;

export const Default: Story = {};

export const AllVariants: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="display: grid; gap: 1.5rem;">
        <lib-data-table [caption]="'Default variant'" [columns]="columns" [rows]="rows" [selectable]="selectable"></lib-data-table>
        <lib-data-table [caption]="'Striped variant'" [columns]="columns" [rows]="rows" [selectable]="selectable" [striped]="true"></lib-data-table>
      </div>
    `,
  }),
};

export const AllStates: Story = {
  args: {
    ...baseArgs,
    selectedIds: new Set(['1', '3']),
    striped: true,
  },
};

export const TailwindTheme: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div class="[--ui-data-table-checkbox-checked-bg:theme(colors.emerald.600)] [--ui-data-table-row-bg-selected:theme(colors.emerald.50)] [--ui-data-table-avatar-bg:theme(colors.emerald.100)] [--ui-data-table-avatar-text:theme(colors.emerald.700)]">
        <lib-data-table [caption]="caption" [columns]="columns" [rows]="rows" [selectable]="selectable"></lib-data-table>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the Tailwind arbitrary-value override path for the --ui-data-table-* token surface.',
      },
    },
  },
};

export const CssTheme: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="--ui-data-table-checkbox-checked-bg: #1d4ed8; --ui-data-table-row-bg-selected: #eff6ff; --ui-data-table-avatar-bg: #dbeafe; --ui-data-table-avatar-text: #1d4ed8; --ui-data-table-label-bg-active: #dbeafe; --ui-data-table-label-text-active: #1e40af;">
        <lib-data-table [caption]="caption" [columns]="columns" [rows]="rows" [selectable]="selectable"></lib-data-table>
      </div>
    `,
  }),
};

export const A11yShowcase: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div>
        <p>
          <strong>Keyboard navigation:</strong> Tab to reach checkboxes and action buttons.
          Space toggles selection. Enter or Space on sortable headers changes sort state.
          Open the action menu, use Arrow keys to move between items, and Escape to close.
        </p>
        <lib-data-table [caption]="'Accessible team members table — keyboard and screen reader ready'" [columns]="columns" [rows]="rows" [selectable]="selectable"></lib-data-table>
      </div>
    `,
  }),
};
