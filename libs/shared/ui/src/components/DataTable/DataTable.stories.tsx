import * as React from 'react';
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

/** NGI-15: Row hover state — move the cursor over any row to see the hover highlight.
 *  Implemented entirely in CSS via `.ui-data-table tbody tr:hover` and the
 *  `--ui-data-table-row-bg-hover` design-system token. No JS state involved. */
export const HoverState: Story = {
  render: () => (
    <div>
      <p style={{ marginBottom: '16px', fontSize: '14px', color: '#6B7280' }}>
        <strong>Row hover:</strong> Move the cursor over any row. The background changes
        to <code>--ui-data-table-row-bg-hover</code>. Only the row under the cursor is
        highlighted; the effect is removed when the cursor leaves. Cell content and
        layout are unaffected.
      </p>
      <DataTable
        caption="Hover state demo"
        columns={columns}
        rows={rows}
      />
    </div>
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

interface CityRow { city: string; country: string; population: number }

const cityColumns: DataTableColumn<CityRow>[] = [
  { key: 'city', header: 'City', type: 'text' },
  { key: 'country', header: 'Country', type: 'text' },
  { key: 'population', header: 'Population', type: 'numeric' },
];

const cityData: CityRow[] = [
  { city: 'Berlin', country: 'Germany', population: 3645000 },
  { city: 'Paris', country: 'France', population: 2161000 },
  { city: 'Tokyo', country: 'Japan', population: 13960000 },
];

/** NGI-14: Data row rendering — plain `data` array prop, no row wrapping required. */
export const DataProp: StoryObj<DataTableProps<CityRow>> = {
  render: () => (
    <div>
      <p style={{ marginBottom: '16px', fontSize: '14px', color: '#6B7280' }}>
        <strong>Plain data prop:</strong> Pass a raw array of objects via the{' '}
        <code>data</code> prop — no need to wrap each item in{' '}
        <code>{'{ id, data }'}</code>. Row IDs are auto-generated from index.
      </p>
      <DataTable caption="Cities" columns={cityColumns} data={cityData} />
    </div>
  ),
};

/** NGI-16: Empty state — displayed when data is an empty array. */
export const EmptyState: Story = {
  render: () => (
    <div>
      <p style={{ marginBottom: '16px', fontSize: '14px', color: '#6B7280' }}>
        <strong>Empty state:</strong> When <code>data</code> is an empty array, the table shows
        a meaningful placeholder with column headers still visible.
      </p>
      <DataTable caption="Empty table demo" columns={columns} data={[]} />
    </div>
  ),
};

/** NGI-16: Custom empty message */
export const EmptyStateCustomMessage: Story = {
  render: () => (
    <DataTable
      caption="No results table"
      columns={columns}
      data={[]}
      emptyMessage="No team members found. Try adjusting your filters."
    />
  ),
};

/** NGI-16: Loading state — clearly distinct from empty state. */
export const LoadingState: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Displays aria-hidden skeleton rows while data is loading. Use `skeletonRowCount` to match the expected payload size and keep the final column structure visible.',
      },
    },
  },
  render: () => (
    <div>
      <p style={{ marginBottom: '16px', fontSize: '14px', color: '#6B7280' }}>
        <strong>Loading state:</strong> When <code>loading</code> is true, a shimmer skeleton
        is shown — distinct from the empty-state illustration.
      </p>
      <DataTable caption="Loading table demo" columns={columns} data={[]} loading />
    </div>
  ),
};

export const LoadingToData: Story = {
  name: 'Loading → Data transition',
  tags: ['autodocs'],
  render: function LoadingToDataRender() {
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
      const t = setTimeout(() => setLoading(false), 2000);
      return () => clearTimeout(t);
    }, []);

    return (
      <DataTable
        columns={[
          { key: 'name', header: 'Name', type: 'text' },
          { key: 'role', header: 'Role', type: 'text' },
        ]}
        rows={
          loading
            ? []
            : [
                { id: '1', data: { name: 'Alice', role: 'Admin' } },
                { id: '2', data: { name: 'Bob', role: 'Editor' } },
              ]
        }
        loading={loading}
        caption="Team members"
        skeletonRowCount={3}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'After 2 seconds the skeleton is replaced by real data.',
      },
    },
  },
};

/* ──────────────────────────────────────────────────────────────
   NGI-19 through NGI-30: All Cell Types Demo
   ────────────────────────────────────────────────────────────── */

interface CellTypeDemoRow {
  text: string;
  number: number;
  date: string;
  currency: number;
  status: string;
  progress: number;
  avatar: { name: string; initials: string };
  link: { label: string; href: string };
  boolean: boolean;
  iconText: { icon: string; text: string };
  multiline: string;
  tags: string[];
}

const cellTypeDemoColumns: DataTableColumn<CellTypeDemoRow>[] = [
  { key: 'text', header: 'Text', type: 'text' },
  { key: 'number', header: 'Number', type: 'numeric', sortable: true },
  { key: 'date', header: 'Date', type: 'date' },
  { key: 'currency', header: 'Amount', type: 'currency', currencyConfig: { currency: 'USD', locale: 'en-US' } },
  { key: 'status', header: 'Status', type: 'label', getLabelVariant: (v) => (v === 'Active' ? 'active' : 'default') },
  { key: 'progress', header: 'Progress', type: 'progress', showProgressLabel: true },
  { key: 'avatar', header: 'User', type: 'avatar-text', getValue: (row) => ({ name: row.avatar.name, initials: row.avatar.initials }) },
  { key: 'link', header: 'Link', type: 'link', linkTarget: '_blank' },
  { key: 'boolean', header: 'Active', type: 'boolean', booleanDisplay: 'icon' },
  { key: 'iconText', header: 'Category', type: 'icon-text' },
  { key: 'multiline', header: 'Description', type: 'multiline', maxLines: 2, width: '200px' },
  { key: 'tags', header: 'Tags', type: 'tags', width: '160px' },
];

const cellTypeDemoData: DataTableRow<CellTypeDemoRow>[] = [
  {
    id: 'ct-1',
    data: {
      text: 'Project Alpha — a very long cell text that should be truncated with an ellipsis',
      number: 42500,
      date: '2024-06-15',
      currency: 1299.99,
      status: 'Active',
      progress: 75,
      avatar: { name: 'Alice Johnson', initials: 'AJ' },
      link: { label: 'View docs', href: 'https://example.com' },
      boolean: true,
      iconText: { icon: '📁', text: 'Design' },
      multiline: 'This is a multiline description that spans multiple lines to demonstrate the wrapping behavior of the cell.',
      tags: ['React', 'TypeScript', 'UI'],
    },
  },
  {
    id: 'ct-2',
    data: {
      text: 'Task Beta',
      number: 8750,
      date: '2024-01-22',
      currency: 450.0,
      status: 'Inactive',
      progress: 30,
      avatar: { name: 'Bob Smith', initials: 'BS' },
      link: { label: 'GitHub', href: 'https://github.com' },
      boolean: false,
      iconText: { icon: '🔧', text: 'Engineering' },
      multiline: 'Short description.',
      tags: ['Angular', 'Testing'],
    },
  },
  {
    id: 'ct-3',
    data: {
      text: 'Feature Gamma',
      number: 156000,
      date: '2025-03-01',
      currency: 2999.5,
      status: 'Active',
      progress: 100,
      avatar: { name: 'Carol White', initials: 'CW' },
      link: { label: 'Jira', href: 'https://jira.example.com' },
      boolean: true,
      iconText: { icon: '🎨', text: 'Product' },
      multiline: 'Another longer description that should wrap to multiple lines and then get clamped at the configured max-lines value set on the column.',
      tags: ['Storybook', 'CSS', 'Tokens', 'A11y'],
    },
  },
];

/** NGI-19 to NGI-30: All cell types rendered in a single table. */
export const AllCellTypes: StoryObj<DataTableProps<CellTypeDemoRow>> = {
  render: () => (
    <div>
      <p style={{ marginBottom: '16px', fontSize: '14px', color: '#6B7280' }}>
        <strong>All cell types:</strong> Text, Number, Date, Currency, Status/Badge, Progress,
        Avatar, Link, Boolean, Icon+Text, Multiline, and Tags — each with consistent styling
        and proper a11y attributes.
      </p>
      <DataTable
        caption="Cell types demo"
        columns={cellTypeDemoColumns}
        rows={cellTypeDemoData}
        selectable={false}
      />
    </div>
  ),
};

/* ──── NGI-21: Date Cell ──── */
interface DateRow { event: string; date: string }
const dateColumns: DataTableColumn<DateRow>[] = [
  { key: 'event', header: 'Event', type: 'text' },
  { key: 'date', header: 'Date', type: 'date', sortable: true },
];
const dateData: DateRow[] = [
  { event: 'Sprint start', date: '2024-06-01' },
  { event: 'Release', date: '2024-06-14' },
  { event: 'Retrospective', date: '2024-06-15' },
];
/** NGI-21: Date cells render in DD MMM YYYY format with locale support. */
export const DateCell: StoryObj<DataTableProps<DateRow>> = {
  render: () => <DataTable caption="Date cells" columns={dateColumns} data={dateData} selectable={false} />,
};

/* ──── NGI-22: Currency Cell ──── */
interface CurrencyRow { item: string; price: number }
const currencyColumns: DataTableColumn<CurrencyRow>[] = [
  { key: 'item', header: 'Item', type: 'text' },
  { key: 'price', header: 'Price (USD)', type: 'currency', currencyConfig: { currency: 'USD', locale: 'en-US' } },
];
const currencyData: CurrencyRow[] = [
  { item: 'Laptop', price: 1499.99 },
  { item: 'Mouse', price: 29.95 },
  { item: 'Monitor', price: 599.0 },
];
/** NGI-22: Currency cells format values with locale-aware currency symbols. */
export const CurrencyCell: StoryObj<DataTableProps<CurrencyRow>> = {
  render: () => <DataTable caption="Currency cells" columns={currencyColumns} data={currencyData} selectable={false} />,
};

/* ──── NGI-23: Badge / Status Cell ──── */
interface BadgeRow { name: string; status: string }
const badgeColumns: DataTableColumn<BadgeRow>[] = [
  { key: 'name', header: 'Name', type: 'text' },
  { key: 'status', header: 'Status', type: 'label', getLabelVariant: (v) => (v === 'Active' ? 'active' : 'default') },
];
const badgeData: BadgeRow[] = [
  { name: 'Service A', status: 'Active' },
  { name: 'Service B', status: 'Inactive' },
  { name: 'Service C', status: 'Active' },
];
/** NGI-23: Badge cells render color-coded chips for statuses. */
export const BadgeCell: StoryObj<DataTableProps<BadgeRow>> = {
  render: () => <DataTable caption="Badge cells" columns={badgeColumns} data={badgeData} selectable={false} />,
};

/* ──── NGI-24: Progress Cell ──── */
interface ProgressRow { task: string; progress: number }
const progressColumns: DataTableColumn<ProgressRow>[] = [
  { key: 'task', header: 'Task', type: 'text' },
  { key: 'progress', header: 'Progress', type: 'progress', showProgressLabel: true },
];
const progressData: ProgressRow[] = [
  { task: 'Design', progress: 100 },
  { task: 'Development', progress: 60 },
  { task: 'Testing', progress: 25 },
  { task: 'Not started', progress: 0 },
];
/** NGI-24: Progress cells render a horizontal bar with optional percentage label. */
export const ProgressCell: StoryObj<DataTableProps<ProgressRow>> = {
  render: () => <DataTable caption="Progress cells" columns={progressColumns} data={progressData} selectable={false} />,
};

/* ──── NGI-25: Avatar / User Cell ──── */
interface AvatarRow { user: string; initials: string; role: string }
const avatarColumns: DataTableColumn<AvatarRow>[] = [
  { key: 'user', header: 'User', type: 'avatar-text', getValue: (row) => ({ name: row.user, initials: row.initials }) },
  { key: 'role', header: 'Role', type: 'text' },
];
const avatarData: DataTableRow<AvatarRow>[] = [
  { id: 'a1', data: { user: 'Emma Davis', initials: 'ED', role: 'Lead' } },
  { id: 'a2', data: { user: 'Liam Chen', initials: 'LC', role: 'Engineer' } },
  { id: 'a3', data: { user: 'Sophia Kim', initials: 'SK', role: 'Designer' } },
];
/** NGI-25: Avatar cells render a circular avatar with initials alongside the name. */
export const AvatarCell: StoryObj<DataTableProps<AvatarRow>> = {
  render: () => <DataTable caption="Avatar cells" columns={avatarColumns} rows={avatarData} selectable={false} />,
};

/* ──── NGI-26: Link Cell ──── */
interface LinkRow { title: string; link: { label: string; href: string } }
const linkColumns: DataTableColumn<LinkRow>[] = [
  { key: 'title', header: 'Title', type: 'text' },
  { key: 'link', header: 'URL', type: 'link', linkTarget: '_blank' },
];
const linkData: LinkRow[] = [
  { title: 'Documentation', link: { label: 'Docs site', href: 'https://example.com/docs' } },
  { title: 'Repository', link: { label: 'GitHub', href: 'https://github.com' } },
];
/** NGI-26: Link cells render clickable anchors with proper target and rel attributes. */
export const LinkCell: StoryObj<DataTableProps<LinkRow>> = {
  render: () => <DataTable caption="Link cells" columns={linkColumns} data={linkData} selectable={false} />,
};

/* ──── NGI-27: Boolean / Yes-No Cell ──── */
interface BooleanRow { feature: string; enabled: boolean }
const booleanColumns: DataTableColumn<BooleanRow>[] = [
  { key: 'feature', header: 'Feature', type: 'text' },
  { key: 'enabled', header: 'Enabled (icon)', type: 'boolean', booleanDisplay: 'icon' },
];
const booleanData: BooleanRow[] = [
  { feature: 'Dark mode', enabled: true },
  { feature: 'Notifications', enabled: false },
  { feature: 'Auto-save', enabled: true },
];
/** NGI-27: Boolean cells render check/cross icons or Yes/No text. */
export const BooleanCell: StoryObj<DataTableProps<BooleanRow>> = {
  render: () => <DataTable caption="Boolean cells" columns={booleanColumns} data={booleanData} selectable={false} />,
};

/* ──── NGI-28: Icon + Text Cell ──── */
interface IconTextRow { category: { icon: string; text: string }; count: number }
const iconTextColumns: DataTableColumn<IconTextRow>[] = [
  { key: 'category', header: 'Category', type: 'icon-text', iconPosition: 'left' },
  { key: 'count', header: 'Count', type: 'numeric' },
];
const iconTextData: IconTextRow[] = [
  { category: { icon: '📊', text: 'Analytics' }, count: 42 },
  { category: { icon: '🔒', text: 'Security' }, count: 17 },
  { category: { icon: '🚀', text: 'Performance' }, count: 8 },
];
/** NGI-28: Icon+Text cells render an icon alongside text, position configurable. */
export const IconTextCell: StoryObj<DataTableProps<IconTextRow>> = {
  render: () => <DataTable caption="Icon+Text cells" columns={iconTextColumns} data={iconTextData} selectable={false} />,
};

/* ──── NGI-29: Multiline / Description Cell ──── */
interface MultilineRow { title: string; description: string }
const multilineColumns: DataTableColumn<MultilineRow>[] = [
  { key: 'title', header: 'Title', type: 'text' },
  { key: 'description', header: 'Description', type: 'multiline', maxLines: 2, width: '300px' },
];
const multilineData: MultilineRow[] = [
  { title: 'Task A', description: 'This is a longer description that should wrap to multiple lines and be clamped at the configured max-lines value, demonstrating the truncation behavior with -webkit-line-clamp.' },
  { title: 'Task B', description: 'Short note.' },
];
/** NGI-29: Multiline cells render wrapping text with configurable max-lines clamping. */
export const MultilineCell: StoryObj<DataTableProps<MultilineRow>> = {
  render: () => <DataTable caption="Multiline cells" columns={multilineColumns} data={multilineData} selectable={false} />,
};

/* ──── NGI-30: Tags / Labels Cell ──── */
interface TagsRow { name: string; tags: string[] }
const tagsColumns: DataTableColumn<TagsRow>[] = [
  { key: 'name', header: 'Name', type: 'text' },
  { key: 'tags', header: 'Tags', type: 'tags', width: '200px' },
];
const tagsData: TagsRow[] = [
  { name: 'Component A', tags: ['React', 'TypeScript', 'Storybook'] },
  { name: 'Component B', tags: ['Angular', 'SCSS'] },
  { name: 'Component C', tags: ['Vue', 'Tailwind', 'CSS', 'Tokens'] },
];
/** NGI-30: Tags cells render an array of styled chips/labels. */
export const TagsCell: StoryObj<DataTableProps<TagsRow>> = {
  render: () => <DataTable caption="Tags cells" columns={tagsColumns} data={tagsData} selectable={false} />,
};
