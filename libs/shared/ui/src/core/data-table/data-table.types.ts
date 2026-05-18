export type SortDirection = 'asc' | 'desc' | 'none';

export interface SortConfig {
  columnKey: string;
  direction: SortDirection;
}

export type DataTableColumnType = 'text' | 'avatar-text' | 'date' | 'label' | 'numeric' | 'action';

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
  rows: DataTableRow<T>[];
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
}

export interface AvatarTextValue {
  name: string;
  /** URL to avatar image. If omitted, show initials */
  avatarUrl?: string;
  /** Initials to display when no avatarUrl */
  initials?: string;
}
