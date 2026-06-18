import { useState, useCallback } from 'react';
import { DataTable } from '@test-project/shared-ui';
import type {
  DataTableColumn,
  DataTableRow,
  SortConfig,
} from '@test-project/shared-ui';

/* ── NGI-19–30: Split demo data per cell-type group ── */

// Group 1: Text & Numbers (NGI-19, NGI-20)
interface TextNumRow {
  name: string;
  role: string;
  salary: number;
  headcount: number;
}
const TEXT_NUM_COLS: DataTableColumn<TextNumRow>[] = [
  { key: 'name', header: 'Employee Name', type: 'text', width: '220px' },
  { key: 'role', header: 'Role', type: 'text' },
  { key: 'salary', header: 'Salary', type: 'numeric', sortable: true },
  { key: 'headcount', header: 'Team Size', type: 'numeric', sortable: true },
];
const TEXT_NUM_DATA: TextNumRow[] = [
  {
    name: 'Alice Johnson — Senior Platform Engineer',
    role: 'Engineer',
    salary: 120000,
    headcount: 12,
  },
  { name: 'Bob Smith', role: 'Designer', salary: 98000, headcount: 5 },
  { name: 'Carol White', role: 'Manager', salary: 140000, headcount: 24 },
  { name: 'David Lee', role: 'Analyst', salary: 85000, headcount: 3 },
];

// Group 2: Date & Currency (NGI-21, NGI-22)
interface DateCurRow {
  item: string;
  purchased: string;
  price: number;
  warranty: string;
}
const DATE_CUR_COLS: DataTableColumn<DateCurRow>[] = [
  { key: 'item', header: 'Item', type: 'text' },
  { key: 'purchased', header: 'Purchased', type: 'date', sortable: true },
  {
    key: 'price',
    header: 'Price',
    type: 'currency',
    currencyConfig: { currency: 'USD', locale: 'en-US' },
  },
  { key: 'warranty', header: 'Warranty Until', type: 'date' },
];
const DATE_CUR_DATA: DateCurRow[] = [
  {
    item: 'Laptop Pro 16"',
    purchased: '2024-03-15',
    price: 2499.99,
    warranty: '2027-03-15',
  },
  {
    item: 'Wireless Mouse',
    purchased: '2024-06-01',
    price: 29.95,
    warranty: '2025-06-01',
  },
  {
    item: 'Standing Desk',
    purchased: '2023-11-20',
    price: 899.0,
    warranty: '2028-11-20',
  },
  {
    item: '4K Monitor',
    purchased: '2024-01-10',
    price: 599.0,
    warranty: '2027-01-10',
  },
];

// Group 3: Status & Progress (NGI-23, NGI-24)
interface StatusProgRow {
  task: string;
  status: string;
  progress: number;
  priority: string;
}
const STATUS_PROG_COLS: DataTableColumn<StatusProgRow>[] = [
  { key: 'task', header: 'Task', type: 'text', width: '200px' },
  {
    key: 'status',
    header: 'Status',
    type: 'label',
    getLabelVariant: (v) =>
      v === 'Active' || v === 'Done' ? 'active' : 'default',
  },
  {
    key: 'progress',
    header: 'Progress',
    type: 'progress',
    showProgressLabel: true,
    width: '180px',
  },
  {
    key: 'priority',
    header: 'Priority',
    type: 'label',
    getLabelVariant: (v) => (v === 'High' ? 'active' : 'default'),
  },
];
const STATUS_PROG_DATA: StatusProgRow[] = [
  {
    task: 'Design system tokens',
    status: 'Done',
    progress: 100,
    priority: 'High',
  },
  { task: 'API integration', status: 'Active', progress: 60, priority: 'High' },
  { task: 'Unit tests', status: 'Active', progress: 25, priority: 'Medium' },
  { task: 'Documentation', status: 'Blocked', progress: 0, priority: 'Low' },
];

// Group 4: Avatar & Link (NGI-25, NGI-26)
interface AvatarLinkRow {
  user: string;
  initials: string;
  role: string;
  profile: { label: string; href: string };
  docs: { label: string; href: string };
}
const AVATAR_LINK_COLS: DataTableColumn<AvatarLinkRow>[] = [
  {
    key: 'user',
    header: 'User',
    type: 'avatar-text',
    getValue: (r) => ({ name: r.user, initials: r.initials }),
    width: '200px',
  },
  { key: 'role', header: 'Role', type: 'text' },
  { key: 'profile', header: 'Profile', type: 'link', linkTarget: '_blank' },
  { key: 'docs', header: 'Docs', type: 'link', linkTarget: '_blank' },
];
const AVATAR_LINK_DATA: DataTableRow<AvatarLinkRow>[] = [
  {
    id: 'al1',
    data: {
      user: 'Alice Johnson',
      initials: 'AJ',
      role: 'Engineer',
      profile: { label: 'GitHub', href: 'https://github.com' },
      docs: { label: 'Wiki', href: 'https://example.com/wiki' },
    },
  },
  {
    id: 'al2',
    data: {
      user: 'Bob Smith',
      initials: 'BS',
      role: 'Designer',
      profile: { label: 'Dribbble', href: 'https://dribbble.com' },
      docs: { label: 'Figma', href: 'https://figma.com' },
    },
  },
  {
    id: 'al3',
    data: {
      user: 'Carol White',
      initials: 'CW',
      role: 'Manager',
      profile: { label: 'LinkedIn', href: 'https://linkedin.com' },
      docs: { label: 'Notion', href: 'https://notion.so' },
    },
  },
];

// Group 5: Boolean & Icon+Text (NGI-27, NGI-28)
interface BoolIconRow {
  feature: string;
  enabled: boolean;
  verified: boolean;
  category: { icon: string; text: string };
}
const BOOL_ICON_COLS: DataTableColumn<BoolIconRow>[] = [
  { key: 'feature', header: 'Feature', type: 'text', width: '180px' },
  {
    key: 'enabled',
    header: 'Enabled',
    type: 'boolean',
    booleanDisplay: 'icon',
  },
  {
    key: 'verified',
    header: 'Verified',
    type: 'boolean',
    booleanDisplay: 'text',
  },
  {
    key: 'category',
    header: 'Category',
    type: 'icon-text',
    iconPosition: 'left',
  },
];
const BOOL_ICON_DATA: BoolIconRow[] = [
  {
    feature: 'Dark mode',
    enabled: true,
    verified: true,
    category: { icon: '🎨', text: 'Appearance' },
  },
  {
    feature: 'Push notifications',
    enabled: false,
    verified: false,
    category: { icon: '🔔', text: 'Alerts' },
  },
  {
    feature: 'Auto-save',
    enabled: true,
    verified: true,
    category: { icon: '💾', text: 'Storage' },
  },
  {
    feature: '2FA login',
    enabled: true,
    verified: false,
    category: { icon: '🔒', text: 'Security' },
  },
];

// Group 6: Multiline & Tags (NGI-29, NGI-30)
interface MultiTagRow {
  title: string;
  description: string;
  tags: string[];
}
const MULTI_TAG_COLS: DataTableColumn<MultiTagRow>[] = [
  { key: 'title', header: 'Component', type: 'text', width: '150px' },
  {
    key: 'description',
    header: 'Description',
    type: 'multiline',
    maxLines: 2,
    width: '360px',
  },
  { key: 'tags', header: 'Tags', type: 'tags', width: '220px' },
];
const MULTI_TAG_DATA: MultiTagRow[] = [
  {
    title: 'DataTable',
    description:
      'A full-featured data table component with sorting, selection, pagination, and 12 cell types. Supports both React and Angular via the cross-framework architecture.',
    tags: ['React', 'Angular', 'TypeScript', 'A11y'],
  },
  {
    title: 'Button',
    description: 'Primary action component with variants.',
    tags: ['UI', 'Core'],
  },
  {
    title: 'Modal',
    description:
      'Overlay dialog for confirmations, forms, and alerts. Includes focus trap, backdrop click dismiss, and keyboard (Escape) handling for accessibility.',
    tags: ['Overlay', 'A11y', 'Focus Trap'],
  },
];

interface Employee {
  name: string;
  initials: string;
  role: string;
  department: string;
  joined: Date;
  salary: number;
  status: 'active' | 'inactive';
}

const COLUMNS: DataTableColumn<Employee>[] = [
  {
    key: 'name',
    header: 'Name',
    type: 'avatar-text',
    sortable: true,
    getValue: (r) => ({ name: r.name, initials: r.initials }),
  },
  { key: 'role', header: 'Role', type: 'text', sortable: true },
  { key: 'department', header: 'Department', type: 'text', sortable: true },
  {
    key: 'joined',
    header: 'Joined',
    type: 'date',
    sortable: true,
    getValue: (r) => r.joined,
  },
  {
    key: 'salary',
    header: 'Salary',
    type: 'numeric',
    sortable: true,
    getValue: (r) => r.salary,
  },
  {
    key: 'status',
    header: 'Status',
    type: 'label',
    getLabelVariant: (v) => (v === 'active' ? 'active' : 'default'),
  },
  {
    key: 'actions',
    header: 'Actions',
    type: 'action',
    actions: [
      { key: 'edit', label: 'Edit' },
      { key: 'delete', label: 'Delete' },
    ],
  },
];

const ROWS: DataTableRow<Employee>[] = [
  {
    id: '1',
    data: {
      name: 'Alice Johnson',
      initials: 'AJ',
      role: 'Engineer',
      department: 'Platform',
      joined: new Date('2021-03-15'),
      salary: 120000,
      status: 'active',
    },
  },
  {
    id: '2',
    data: {
      name: 'Bob Smith',
      initials: 'BS',
      role: 'Designer',
      department: 'Product',
      joined: new Date('2022-07-01'),
      salary: 98000,
      status: 'active',
    },
  },
  {
    id: '3',
    data: {
      name: 'Carol White',
      initials: 'CW',
      role: 'Manager',
      department: 'Operations',
      joined: new Date('2020-01-20'),
      salary: 140000,
      status: 'active',
    },
  },
  {
    id: '4',
    data: {
      name: 'David Lee',
      initials: 'DL',
      role: 'Analyst',
      department: 'Finance',
      joined: new Date('2023-02-10'),
      salary: 85000,
      status: 'inactive',
    },
  },
  {
    id: '5',
    data: {
      name: 'Eva Martinez',
      initials: 'EM',
      role: 'Engineer',
      department: 'Platform',
      joined: new Date('2019-11-05'),
      salary: 135000,
      status: 'active',
    },
  },
];

// NGI-13: Static columns (no getValue) + NGI-14: plain data array
interface City {
  city: string;
  country: string;
  population: number;
}

const CITY_COLUMNS: DataTableColumn<City>[] = [
  { key: 'city', header: 'City', type: 'text' },
  { key: 'country', header: 'Country', type: 'text' },
  { key: 'population', header: 'Population', type: 'numeric' },
];

const CITY_DATA: City[] = [
  { city: 'Berlin', country: 'Germany', population: 3645000 },
  { city: 'Paris', country: 'France', population: 2161000 },
  { city: 'Tokyo', country: 'Japan', population: 13960000 },
  { city: 'New York', country: 'USA', population: 8336817 },
];

export function App() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    columnKey: 'name',
    direction: 'asc',
  });

  // NGI-16: Loading state simulation
  const [isLoading, setIsLoading] = useState(false);
  const [loadedData, setLoadedData] = useState<Employee[] | null>(null);

  const simulateFetch = useCallback(() => {
    setIsLoading(true);
    setLoadedData(null);
    setTimeout(() => {
      setIsLoading(false);
      setLoadedData([
        {
          name: 'Alice Johnson',
          initials: 'AJ',
          role: 'Engineer',
          department: 'Platform',
          joined: new Date('2021-03-15'),
          salary: 120000,
          status: 'active',
        },
        {
          name: 'Bob Smith',
          initials: 'BS',
          role: 'Designer',
          department: 'Product',
          joined: new Date('2022-07-01'),
          salary: 98000,
          status: 'inactive',
        },
      ]);
    }, 2000);
  }, []);

  const resetDemo = useCallback(() => {
    setIsLoading(false);
    setLoadedData(null);
  }, []);

  return (
    <div
      style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '1200px' }}
    >
      <h1
        style={{ marginBottom: '0.25rem', fontSize: '1.5rem', fontWeight: 700 }}
      >
        React — Data Table Demo
      </h1>
      <p
        style={{ marginBottom: '2rem', color: '#6B7280', fontSize: '0.875rem' }}
      >
        Showcasing NGI-12 · NGI-13 · NGI-14 · NGI-15 · NGI-16
      </p>

      <h2
        style={{
          marginBottom: '0.5rem',
          fontSize: '1rem',
          fontWeight: 600,
          color: '#374151',
        }}
      >
        Employee Directory{' '}
        <span style={{ fontWeight: 400, color: '#9CA3AF' }}>
          (rows prop · custom getValue)
        </span>
      </h2>
      <p
        style={{
          marginBottom: '0.75rem',
          color: '#6B7280',
          fontSize: '0.875rem',
        }}
      >
        {selectedIds.size} row{selectedIds.size !== 1 ? 's' : ''} selected ·
        Hover any row to see NGI-15 hover state
      </p>
      <DataTable
        caption="Employee directory"
        columns={COLUMNS}
        rows={ROWS}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        sortConfig={sortConfig}
        onSort={setSortConfig}
        onActionSelect={(rowId, action) =>
          alert(`Action "${action}" on row ${rowId}`)
        }
        striped
      />

      <h2
        style={{
          marginTop: '3rem',
          marginBottom: '0.5rem',
          fontSize: '1rem',
          fontWeight: 600,
          color: '#374151',
        }}
      >
        City Population{' '}
        <span style={{ fontWeight: 400, color: '#9CA3AF' }}>
          (data prop · static columns · no getValue)
        </span>
      </h2>
      <p
        style={{
          marginBottom: '0.75rem',
          color: '#6B7280',
          fontSize: '0.875rem',
        }}
      >
        NGI-13: column key auto-resolves cell value · NGI-14: plain{' '}
        <code>data</code> array, no row wrapping
      </p>
      <DataTable
        caption="City population"
        columns={CITY_COLUMNS}
        data={CITY_DATA}
      />

      {/* NGI-16: Empty state demo */}
      <h2
        style={{
          marginTop: '3rem',
          marginBottom: '0.5rem',
          fontSize: '1rem',
          fontWeight: 600,
          color: '#374151',
        }}
      >
        Empty State{' '}
        <span style={{ fontWeight: 400, color: '#9CA3AF' }}>
          (NGI-16 · data=[])
        </span>
      </h2>
      <p
        style={{
          marginBottom: '0.75rem',
          color: '#6B7280',
          fontSize: '0.875rem',
        }}
      >
        When <code>data</code> is an empty array, a placeholder with icon and
        message is shown. Column headers remain visible.
      </p>
      <DataTable caption="Empty table" columns={CITY_COLUMNS} data={[]} />

      <div style={{ marginTop: '1.5rem' }}>
        <DataTable
          caption="Custom empty message"
          columns={CITY_COLUMNS}
          data={[]}
          emptyMessage="No cities match your search. Try a different filter."
        />
      </div>

      {/* NGI-16: Loading state demo */}
      <h2
        style={{
          marginTop: '3rem',
          marginBottom: '0.5rem',
          fontSize: '1rem',
          fontWeight: 600,
          color: '#374151',
        }}
      >
        Loading State{' '}
        <span style={{ fontWeight: 400, color: '#9CA3AF' }}>
          (NGI-16 · loading=true)
        </span>
      </h2>
      <p
        style={{
          marginBottom: '0.75rem',
          color: '#6B7280',
          fontSize: '0.875rem',
        }}
      >
        When <code>loading</code> is true, a shimmer skeleton is shown — clearly
        distinct from the empty state. Click the button to simulate a 2-second
        data fetch.
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <button
          onClick={simulateFetch}
          disabled={isLoading}
          style={{
            padding: '0.375rem 0.75rem',
            borderRadius: '6px',
            border: 'none',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            background: '#7c3aed',
            color: '#fff',
            fontSize: '0.875rem',
            fontWeight: 500,
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? 'Loading…' : '▶ Simulate fetch (2s)'}
        </button>
        <button
          onClick={resetDemo}
          style={{
            padding: '0.375rem 0.75rem',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            cursor: 'pointer',
            background: '#fff',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: '#374151',
          }}
        >
          Reset
        </button>
      </div>
      <DataTable
        caption="Dynamic employee table"
        columns={COLUMNS}
        data={loadedData ?? []}
        loading={isLoading}
        emptyMessage="Click 'Simulate fetch' above to load data."
      />

      {/* NGI-19–30: Cell Types — split into focused tables */}
      <h2
        style={{
          marginTop: '3rem',
          marginBottom: '0.25rem',
          fontSize: '1.25rem',
          fontWeight: 700,
          color: '#111827',
        }}
      >
        Cell Types{' '}
        <span style={{ fontWeight: 400, color: '#9CA3AF' }}>
          (NGI-19 through NGI-30)
        </span>
      </h2>
      <p
        style={{
          marginBottom: '1.5rem',
          color: '#6B7280',
          fontSize: '0.875rem',
        }}
      >
        Each table below highlights a pair of related cell types.
      </p>

      {/* Text & Number */}
      <h3
        style={{
          marginBottom: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: '#374151',
        }}
      >
        Text &amp; Number{' '}
        <span style={{ fontWeight: 400, color: '#9CA3AF' }}>
          (NGI-19 · NGI-20)
        </span>
      </h3>
      <p
        style={{
          marginBottom: '0.5rem',
          color: '#6B7280',
          fontSize: '0.8125rem',
        }}
      >
        Text truncates with ellipsis. Numbers are right-aligned with{' '}
        <code>tabular-nums</code>.
      </p>
      <DataTable
        caption="Text and number cells"
        columns={TEXT_NUM_COLS}
        data={TEXT_NUM_DATA}
        selectable={false}
      />

      {/* Date & Currency */}
      <h3
        style={{
          marginTop: '2rem',
          marginBottom: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: '#374151',
        }}
      >
        Date &amp; Currency{' '}
        <span style={{ fontWeight: 400, color: '#9CA3AF' }}>
          (NGI-21 · NGI-22)
        </span>
      </h3>
      <p
        style={{
          marginBottom: '0.5rem',
          color: '#6B7280',
          fontSize: '0.8125rem',
        }}
      >
        Dates render as DD MMM YYYY. Currency uses{' '}
        <code>Intl.NumberFormat</code> with locale.
      </p>
      <DataTable
        caption="Date and currency cells"
        columns={DATE_CUR_COLS}
        data={DATE_CUR_DATA}
        selectable={false}
      />

      {/* Status & Progress */}
      <h3
        style={{
          marginTop: '2rem',
          marginBottom: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: '#374151',
        }}
      >
        Status Badge &amp; Progress{' '}
        <span style={{ fontWeight: 400, color: '#9CA3AF' }}>
          (NGI-23 · NGI-24)
        </span>
      </h3>
      <p
        style={{
          marginBottom: '0.5rem',
          color: '#6B7280',
          fontSize: '0.8125rem',
        }}
      >
        Badges are color-coded chips. Progress shows a horizontal bar with
        percentage label.
      </p>
      <DataTable
        caption="Status and progress cells"
        columns={STATUS_PROG_COLS}
        data={STATUS_PROG_DATA}
        selectable={false}
      />

      {/* Avatar & Link */}
      <h3
        style={{
          marginTop: '2rem',
          marginBottom: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: '#374151',
        }}
      >
        Avatar &amp; Link{' '}
        <span style={{ fontWeight: 400, color: '#9CA3AF' }}>
          (NGI-25 · NGI-26)
        </span>
      </h3>
      <p
        style={{
          marginBottom: '0.5rem',
          color: '#6B7280',
          fontSize: '0.8125rem',
        }}
      >
        Avatar shows circular initials + name. Links are clickable anchors with{' '}
        <code>target=_blank</code>.
      </p>
      <DataTable
        caption="Avatar and link cells"
        columns={AVATAR_LINK_COLS}
        rows={AVATAR_LINK_DATA}
        selectable={false}
      />

      {/* Boolean & Icon+Text */}
      <h3
        style={{
          marginTop: '2rem',
          marginBottom: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: '#374151',
        }}
      >
        Boolean &amp; Icon+Text{' '}
        <span style={{ fontWeight: 400, color: '#9CA3AF' }}>
          (NGI-27 · NGI-28)
        </span>
      </h3>
      <p
        style={{
          marginBottom: '0.5rem',
          color: '#6B7280',
          fontSize: '0.8125rem',
        }}
      >
        Boolean renders ✓/✗ icons or Yes/No text. Icon+Text places an icon
        alongside text.
      </p>
      <DataTable
        caption="Boolean and icon-text cells"
        columns={BOOL_ICON_COLS}
        data={BOOL_ICON_DATA}
        selectable={false}
      />

      {/* Multiline & Tags */}
      <h3
        style={{
          marginTop: '2rem',
          marginBottom: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: '#374151',
        }}
      >
        Multiline &amp; Tags{' '}
        <span style={{ fontWeight: 400, color: '#9CA3AF' }}>
          (NGI-29 · NGI-30)
        </span>
      </h3>
      <p
        style={{
          marginBottom: '0.5rem',
          color: '#6B7280',
          fontSize: '0.8125rem',
        }}
      >
        Multiline wraps and clamps with <code>-webkit-line-clamp</code>. Tags
        render as styled chips.
      </p>
      <DataTable
        caption="Multiline and tags cells"
        columns={MULTI_TAG_COLS}
        data={MULTI_TAG_DATA}
        selectable={false}
      />
    </div>
  );
}

export default App;
