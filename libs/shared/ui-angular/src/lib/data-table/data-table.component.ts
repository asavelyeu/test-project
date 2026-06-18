import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  QueryList,
  ViewChildren,
  ViewEncapsulation,
  inject,
} from '@angular/core';

import {
  clampProgress,
  computeSelectionState,
  formatBoolean,
  formatCurrency,
  formatDate,
  formatNumeric,
  getCellValue as getCellValueCore,
  getActionButtonAriaLabel,
  getActionMenuAriaLabel,
  getActionMenuKeyAction,
  getAriaSortValue,
  getCheckboxAriaLabel,
  getInitials,
  getSelectAllAriaLabel,
  nextSortDirection,
  normalizeRows,
  toggleAllSelection,
  toggleRowSelection,
} from '../../../../ui/src/core/data-table';
import type {
  ActionMenuItem,
  AvatarTextValue,
  DataTableColumn,
  DataTableRow,
  IconTextValue,
  LinkValue,
  SelectionState,
  SortConfig,
} from '../../../../ui/src/core/data-table';

@Component({
  selector: 'lib-data-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-table.component.html',
  styles: [
    `
      @import '../../../../ui/src/core/data-table/data-table.css';

      :host {
        display: block;
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  private static nextId = 0;

  @Input({ required: true }) columns: DataTableColumn<T>[] = [];
  /** Pre-wrapped rows with explicit IDs. Takes precedence over `data` if both provided. */
  @Input() rows?: DataTableRow<T>[];
  /** Plain data array — rows are auto-generated with stable index-based IDs. */
  @Input() data?: T[];
  @Input() caption = 'Data table';
  @Input() selectable = true;
  @Input() striped = false;
  @Input() selectedIds?: Set<string>;
  @Input() sortConfig?: SortConfig;
  /** When true, shows a loading skeleton in place of rows */
  @Input() loading = false;
  /** Number of placeholder rows shown during loading. Defaults to 5. */
  @Input() skeletonRowCount = 5;
  /** Message shown when data is empty and not loading. Defaults to "No data available" */
  @Input() emptyMessage = 'No data available';

  private readonly skeletonWidths = [
    '72%',
    '55%',
    '80%',
    '45%',
    '65%',
    '50%',
    '38%',
    '70%',
  ];

  @Output() readonly selectionChange = new EventEmitter<Set<string>>();
  @Output() readonly actionClick = new EventEmitter<{
    rowId: string;
    actionKey: string;
  }>();
  @Output() readonly sortChange = new EventEmitter<SortConfig>();

  @ViewChildren('actionMenu') private readonly actionMenus?: QueryList<
    ElementRef<HTMLUListElement>
  >;
  @ViewChildren('actionTrigger') private readonly actionTriggers?: QueryList<
    ElementRef<HTMLButtonElement>
  >;

  readonly captionId = `ui-data-table-caption-${DataTableComponent.nextId++}`;
  openActionRowId: string | null = null;

  private readonly document = inject(DOCUMENT);
  private internalSelectedIds = new Set<string>();

  get effectiveRows(): DataTableRow<T>[] {
    return this.rows ?? normalizeRows(this.data ?? []);
  }

  get effectiveSelectedIds(): Set<string> {
    return this.selectedIds ?? this.internalSelectedIds;
  }

  get skeletonRows(): number[] {
    return Array.from(
      { length: this.skeletonRowCount },
      (_value, index) => index,
    );
  }

  get selectionState(): SelectionState {
    return computeSelectionState(this.effectiveRows, this.effectiveSelectedIds);
  }

  get selectAllLabel(): string {
    return getSelectAllAriaLabel(
      this.selectionState.allSelected,
      this.selectionState.someSelected,
    );
  }

  trackByColumnKey = (_index: number, column: DataTableColumn<T>): string =>
    column.key;
  trackByRowId = (_index: number, row: DataTableRow<T>): string => row.id;
  trackByActionKey = (_index: number, action: ActionMenuItem): string =>
    action.key;

  isRowSelected(rowId: string): boolean {
    return this.effectiveSelectedIds.has(rowId);
  }

  getAriaSort(
    column: DataTableColumn<T>,
  ): 'ascending' | 'descending' | 'none' | null {
    return column.sortable
      ? (getAriaSortValue(column.key, this.sortConfig) ?? 'none')
      : null;
  }

  getCellValue(column: DataTableColumn<T>, row: DataTableRow<T>): unknown {
    return getCellValueCore(column, row);
  }

  isAvatarTextValue(value: unknown): value is AvatarTextValue {
    return typeof value === 'object' && value !== null && 'name' in value;
  }

  getAvatarValue(
    column: DataTableColumn<T>,
    row: DataTableRow<T>,
  ): AvatarTextValue | null {
    const value = this.getCellValue(column, row);
    return this.isAvatarTextValue(value) ? value : null;
  }

  getAvatarInitials(value: AvatarTextValue): string {
    return value.initials ?? getInitials(value.name);
  }

  formatDateValue(value: unknown): string {
    return formatDate(value as Date | string | null | undefined);
  }

  formatNumericValue(value: unknown): string {
    return formatNumeric(value as number | null | undefined);
  }

  getLabelVariant(
    column: DataTableColumn<T>,
    value: unknown,
  ): 'default' | 'active' {
    return column.getLabelVariant?.(value) ?? 'default';
  }

  formatCurrencyValue(value: unknown, column: DataTableColumn<T>): string {
    return formatCurrency(
      value as number | null | undefined,
      column.currencyConfig,
    );
  }

  getProgressData(value: unknown): { percent: number; label: string } {
    return clampProgress(value as number | null | undefined);
  }

  isLinkValue(value: unknown): value is LinkValue {
    return (
      typeof value === 'object' &&
      value !== null &&
      'href' in value &&
      'label' in value
    );
  }

  getLinkValue(
    column: DataTableColumn<T>,
    row: DataTableRow<T>,
  ): LinkValue | null {
    const value = this.getCellValue(column, row);
    return this.isLinkValue(value) ? value : null;
  }

  getBooleanData(
    value: unknown,
    column: DataTableColumn<T>,
  ): { label: string; state: boolean } {
    return formatBoolean(value, column.booleanDisplay ?? 'text');
  }

  isIconTextValue(value: unknown): value is IconTextValue {
    return (
      typeof value === 'object' &&
      value !== null &&
      'icon' in value &&
      'text' in value
    );
  }

  getIconTextValue(
    column: DataTableColumn<T>,
    row: DataTableRow<T>,
  ): IconTextValue | null {
    const value = this.getCellValue(column, row);
    return this.isIconTextValue(value) ? value : null;
  }

  getTagsArray(column: DataTableColumn<T>, row: DataTableRow<T>): string[] {
    const value = this.getCellValue(column, row);
    return Array.isArray(value) ? value.map(String) : [];
  }

  getMultilineStyle(column: DataTableColumn<T>): Record<string, string> {
    const maxLines = column.maxLines ?? 3;
    return { '-webkit-line-clamp': String(maxLines) };
  }

  getHeaderText(column: DataTableColumn<T>): string {
    return column.header || (column.type === 'action' ? 'Actions' : column.key);
  }

  getRowLabel(row: DataTableRow<T>): string {
    for (const column of this.columns) {
      const value = this.getCellValue(column, row);
      if (column.type === 'avatar-text' && this.isAvatarTextValue(value)) {
        return value.name;
      }
      if (
        column.type === 'text' &&
        typeof value === 'string' &&
        value.trim().length > 0
      ) {
        return value;
      }
    }

    return row.id;
  }

  getCheckboxLabel(row: DataTableRow<T>): string {
    return getCheckboxAriaLabel(
      this.getRowLabel(row),
      this.isRowSelected(row.id),
    );
  }

  getActionButtonLabel(row: DataTableRow<T>): string {
    return getActionButtonAriaLabel(this.getRowLabel(row));
  }

  getActionMenuLabel(row: DataTableRow<T>): string {
    return getActionMenuAriaLabel(this.getRowLabel(row));
  }

  getActionMenuId(rowId: string): string {
    return `ui-data-table-action-menu-${rowId}`;
  }

  toggleSelectAll(): void {
    this.emitSelectionChange(
      toggleAllSelection(this.effectiveRows, this.effectiveSelectedIds),
    );
  }

  toggleRow(rowId: string): void {
    this.emitSelectionChange(
      toggleRowSelection(rowId, this.effectiveSelectedIds),
    );
  }

  handleSort(column: DataTableColumn<T>): void {
    if (!column.sortable) {
      return;
    }

    const currentDirection =
      this.sortConfig?.columnKey === column.key
        ? this.sortConfig.direction
        : 'none';
    this.sortChange.emit({
      columnKey: column.key,
      direction: nextSortDirection(currentDirection),
    });
  }

  toggleActionMenu(rowId: string): void {
    this.openActionRowId = this.openActionRowId === rowId ? null : rowId;
    if (this.openActionRowId) {
      setTimeout(() => this.focusFirstMenuItem(rowId));
    }
  }

  closeActionMenu(returnFocusRowId?: string): void {
    const rowId = returnFocusRowId ?? this.openActionRowId ?? undefined;
    this.openActionRowId = null;
    if (rowId) {
      setTimeout(() => this.getActionTriggerElement(rowId)?.focus());
    }
  }

  handleAction(rowId: string, actionKey: string): void {
    this.actionClick.emit({ rowId, actionKey });
    this.closeActionMenu(rowId);
  }

  onActionMenuKeydown(event: KeyboardEvent, rowId: string): void {
    const action = getActionMenuKeyAction(event.key);
    const menuItems = this.getActionMenuItems(rowId);
    const currentIndex = menuItems.findIndex(
      (item) => item === this.document.activeElement,
    );

    if (action === 'none' || action === 'activate' || menuItems.length === 0) {
      return;
    }

    event.preventDefault();

    switch (action) {
      case 'close':
        this.closeActionMenu(rowId);
        break;
      case 'focus-first':
        menuItems[0]?.focus();
        break;
      case 'focus-last':
        menuItems[menuItems.length - 1]?.focus();
        break;
      case 'focus-next':
        menuItems[(currentIndex + 1) % menuItems.length]?.focus();
        break;
      case 'focus-prev':
        menuItems[
          (currentIndex - 1 + menuItems.length) % menuItems.length
        ]?.focus();
        break;
    }
  }

  @HostListener('document:mousedown', ['$event'])
  handleDocumentMouseDown(event: MouseEvent): void {
    if (!this.openActionRowId) {
      return;
    }

    const menu = this.getActionMenuElement(this.openActionRowId);
    const trigger = this.getActionTriggerElement(this.openActionRowId);
    const target = event.target;

    if (
      target instanceof Node &&
      menu &&
      trigger &&
      !menu.contains(target) &&
      !trigger.contains(target)
    ) {
      this.closeActionMenu();
    }
  }

  getSkeletonWidth(rowIdx: number, colIdx: number): string {
    return this.skeletonWidths[
      (rowIdx * this.columns.length + colIdx) % this.skeletonWidths.length
    ];
  }

  getSkeletonDelay(rowIdx: number, colIdx: number): string {
    return `${(rowIdx * this.columns.length + colIdx) * 0.07}s`;
  }

  private emitSelectionChange(nextSelectedIds: Set<string>): void {
    if (this.selectedIds === undefined) {
      this.internalSelectedIds = nextSelectedIds;
    }

    this.selectionChange.emit(nextSelectedIds);
  }

  private focusFirstMenuItem(rowId: string): void {
    this.getActionMenuItems(rowId)[0]?.focus();
  }

  private getActionMenuItems(rowId: string): HTMLButtonElement[] {
    return Array.from(
      this.getActionMenuElement(rowId)?.querySelectorAll<HTMLButtonElement>(
        '[role="menuitem"]',
      ) ?? [],
    );
  }

  private getActionMenuElement(rowId: string): HTMLUListElement | undefined {
    return this.actionMenus?.find(
      (menu) => menu.nativeElement.dataset['rowId'] === rowId,
    )?.nativeElement;
  }

  private getActionTriggerElement(
    rowId: string,
  ): HTMLButtonElement | undefined {
    return this.actionTriggers?.find(
      (button) => button.nativeElement.dataset['rowId'] === rowId,
    )?.nativeElement;
  }
}
