export type SortDirection = 'asc' | 'desc' | 'none';

export interface SortConfig {
  columnKey: string;
  direction: SortDirection;
}

export type DataTableColumnType =
  | 'text'
  | 'avatar-text'
  | 'date'
  | 'label'
  | 'numeric'
  | 'action'
  | 'currency'
  | 'progress'
  | 'link'
  | 'boolean'
  | 'icon-text'
  | 'multiline'
  | 'tags';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  type: DataTableColumnType;
  sortable?: boolean;
  width?: string;
  /** For label columns: map value to active/inactive state */
  getLabelVariant?: (value: unknown) => 'default' | 'active';
  /** For action columns: list of available actions */
  actions?: ActionMenuItem[];
  /** Custom cell value getter */
  getValue?: (row: T) => string | number | Date | AvatarTextValue | null | undefined;
  /** For currency columns: locale and currency code */
  currencyConfig?: CurrencyConfig;
  /** For link columns: target attribute */
  linkTarget?: '_blank' | '_self';
  /** For boolean columns: display mode */
  booleanDisplay?: 'text' | 'icon';
  /** For multiline columns: max visible lines (0 = unlimited) */
  maxLines?: number;
  /** For progress columns: show numeric label */
  showProgressLabel?: boolean;
  /** For icon-text columns: icon position */
  iconPosition?: 'left' | 'right';
}

export interface CurrencyConfig {
  currency?: string;
  locale?: string;
}

export interface LinkValue {
  label: string;
  href: string;
}

export interface IconTextValue {
  icon: string;
  text: string;
}

export interface ProgressValue {
  value: number;
  max?: number;
}

export interface ActionMenuItem {
  label: string;
  key: string;
}

export interface DataTableRow<T> {
  id: string;
  data: T;
}

export interface SelectionState {
  selectedIds: Set<string>;
  allSelected: boolean;
  someSelected: boolean;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  /** Pre-wrapped rows with explicit IDs. Takes precedence over `data` if both provided. */
  rows?: DataTableRow<T>[];
  /** Plain data array — rows are auto-generated with stable index-based IDs. */
  data?: T[];
  /** Controlled selection. If omitted, component is uncontrolled */
  selectedIds?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  onActionSelect?: (rowId: string, actionKey: string) => void;
  onSort?: (config: SortConfig) => void;
  sortConfig?: SortConfig;
  /** Caption for the table (required for a11y) */
  caption: string;
  /** Whether to show alternating row backgrounds */
  striped?: boolean;
  className?: string;
  /** When true, shows a loading skeleton in place of rows */
  loading?: boolean;
  /** Number of placeholder rows shown during loading. Defaults to 5. */
  skeletonRowCount?: number;
  /** Message shown when data is empty and not loading. Defaults to "No data available" */
  emptyMessage?: string;
}

export interface AvatarTextValue {
  name: string;
  /** URL to avatar image. If omitted, show initials */
  avatarUrl?: string;
  /** Initials to display when no avatarUrl */
  initials?: string;
}
