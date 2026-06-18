import { Component, signal } from '@angular/core';
import { DataTableComponent } from '@test-project/shared-ui-angular';
import type {
  DataTableColumn,
  DataTableRow,
  SortConfig,
} from '@test-project/shared-ui/core';

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
const AVATAR_LINK_ROWS: DataTableRow<AvatarLinkRow>[] = [
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

@Component({
  imports: [DataTableComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  columns = COLUMNS;
  rows = ROWS;
  cityColumns = CITY_COLUMNS;
  cityData = CITY_DATA;
  textNumCols = TEXT_NUM_COLS;
  textNumData = TEXT_NUM_DATA;
  dateCurCols = DATE_CUR_COLS;
  dateCurData = DATE_CUR_DATA;
  statusProgCols = STATUS_PROG_COLS;
  statusProgData = STATUS_PROG_DATA;
  avatarLinkCols = AVATAR_LINK_COLS;
  avatarLinkRows = AVATAR_LINK_ROWS;
  boolIconCols = BOOL_ICON_COLS;
  boolIconData = BOOL_ICON_DATA;
  multiTagCols = MULTI_TAG_COLS;
  multiTagData = MULTI_TAG_DATA;
  selectedIds = signal<Set<string>>(new Set());
  sortConfig = signal<SortConfig>({ columnKey: 'name', direction: 'asc' });

  // NGI-16: loading state simulation
  isLoading = signal(false);
  loadedData = signal<Employee[] | null>(null);
  fetchTimer: ReturnType<typeof setTimeout> | null = null;

  get selectionCount() {
    return this.selectedIds().size;
  }

  get dynamicData(): Employee[] {
    return this.loadedData() ?? [];
  }

  get dynamicEmptyMessage(): string {
    return "Click 'Simulate fetch' above to load data.";
  }

  onSelectionChange(ids: Set<string>) {
    this.selectedIds.set(ids);
  }

  onSort(config: SortConfig) {
    this.sortConfig.set(config);
  }

  onActionSelect(rowId: string, actionKey: string) {
    alert(`Action "${actionKey}" on row ${rowId}`);
  }

  simulateFetch() {
    this.isLoading.set(true);
    this.loadedData.set(null);
    this.fetchTimer = setTimeout(() => {
      this.isLoading.set(false);
      this.loadedData.set([
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
  }

  resetDemo() {
    if (this.fetchTimer) clearTimeout(this.fetchTimer);
    this.isLoading.set(false);
    this.loadedData.set(null);
  }
}
