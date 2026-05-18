import { useCallback, useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type {
  AvatarTextValue,
  DataTableColumn,
  DataTableProps,
  DataTableRow,
} from '../../core/data-table/data-table.types';
import {
  computeSelectionState,
  formatDate,
  formatNumeric,
  getInitials,
  nextSortDirection,
  toggleAllSelection,
  toggleRowSelection,
} from '../../core/data-table/data-table.logic';
import {
  getActionButtonAriaLabel,
  getActionMenuAriaLabel,
  getActionMenuKeyAction,
  getAriaSortValue,
  getCheckboxAriaLabel,
  getSelectAllAriaLabel,
} from '../../core/data-table/data-table.a11y';

import '../../core/data-table/data-table.css';

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

function isAvatarTextValue(val: unknown): val is AvatarTextValue {
  return typeof val === 'object' && val !== null && 'name' in val;
}

interface DataTableInternalProps<T> extends DataTableProps<T> {
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  selectedIds: controlledSelectedIds,
  onSelectionChange,
  onActionSelect,
  onSort,
  sortConfig,
  caption,
  striped = false,
  className,
}: DataTableInternalProps<T>) {
  const isControlled = controlledSelectedIds !== undefined;
  const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(new Set());
  const selectedIds = isControlled ? controlledSelectedIds : internalSelectedIds;

  const [openActionRowId, setOpenActionRowId] = useState<string | null>(null);
  const actionMenuRefs = useRef<Record<string, HTMLUListElement | null>>({});
  const actionBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const selectionState = computeSelectionState(rows, selectedIds);

  const handleSelectionChange = useCallback(
    (nextIds: Set<string>) => {
      if (!isControlled) setInternalSelectedIds(nextIds);
      onSelectionChange?.(nextIds);
    },
    [isControlled, onSelectionChange]
  );

  const handleSelectAll = useCallback(() => {
    handleSelectionChange(toggleAllSelection(rows, selectedIds));
  }, [rows, selectedIds, handleSelectionChange]);

  const handleRowSelect = useCallback(
    (rowId: string) => {
      handleSelectionChange(toggleRowSelection(rowId, selectedIds));
    },
    [selectedIds, handleSelectionChange]
  );

  const handleSort = useCallback(
    (columnKey: string) => {
      if (!onSort) return;
      const currentDir =
        sortConfig?.columnKey === columnKey ? sortConfig.direction : 'none';
      onSort({ columnKey, direction: nextSortDirection(currentDir) });
    },
    [onSort, sortConfig]
  );

  const handleOpenActionMenu = useCallback((rowId: string) => {
    setOpenActionRowId((prev) => (prev === rowId ? null : rowId));
  }, []);

  const handleCloseActionMenu = useCallback(
    (returnFocusRowId?: string) => {
      setOpenActionRowId(null);
      if (returnFocusRowId) {
        actionBtnRefs.current[returnFocusRowId]?.focus();
      }
    },
    []
  );

  useEffect(() => {
    if (openActionRowId) {
      const menu = actionMenuRefs.current[openActionRowId];
      const firstItem = menu?.querySelector<HTMLButtonElement>('[role="menuitem"]');
      firstItem?.focus();
    }
  }, [openActionRowId]);

  useEffect(() => {
    if (!openActionRowId) return;
    const handleClick = (e: MouseEvent) => {
      const menu = actionMenuRefs.current[openActionRowId];
      const btn = actionBtnRefs.current[openActionRowId];
      if (
        menu &&
        !menu.contains(e.target as Node) &&
        btn &&
        !btn.contains(e.target as Node)
      ) {
        handleCloseActionMenu();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [openActionRowId, handleCloseActionMenu]);

  function renderCell<U>(column: DataTableColumn<U>, row: DataTableRow<U>) {
    const rawValue = column.getValue ? column.getValue(row.data) : undefined;

    switch (column.type) {
      case 'avatar-text': {
        if (isAvatarTextValue(rawValue)) {
          const initials = rawValue.initials ?? getInitials(rawValue.name);
          return (
            <td key={column.key} className="ui-data-table-cell">
              <div className="ui-data-table-avatar-cell">
                <div className="ui-data-table-avatar" aria-hidden="true">
                  {rawValue.avatarUrl ? (
                    <img src={rawValue.avatarUrl} alt="" />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <span>{rawValue.name}</span>
              </div>
            </td>
          );
        }
        return <td key={column.key}>{String(rawValue ?? '')}</td>;
      }

      case 'date':
        return (
          <td key={column.key}>
            {formatDate(rawValue as Date | string | null | undefined)}
          </td>
        );

      case 'numeric':
        return (
          <td key={column.key} className="ui-data-table-numeric">
            {formatNumeric(rawValue as number | null | undefined)}
          </td>
        );

      case 'label': {
        const variant = column.getLabelVariant?.(rawValue) ?? 'default';
        return (
          <td key={column.key}>
            <span className="ui-data-table-label" data-variant={variant}>
              {String(rawValue ?? '')}
            </span>
          </td>
        );
      }

      case 'action': {
        const isOpen = openActionRowId === row.id;
        const rowLabel = String(row.id);
        return (
          <td key={column.key} className="ui-data-table-action-cell">
            <button
              ref={(el) => { actionBtnRefs.current[row.id] = el; }}
              type="button"
              className="ui-data-table-action-btn"
              aria-haspopup="menu"
              aria-expanded={isOpen}
              aria-label={getActionButtonAriaLabel(rowLabel)}
              onClick={() => handleOpenActionMenu(row.id)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') handleCloseActionMenu(row.id);
              }}
            >
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="3" r="1.5" />
                <circle cx="8" cy="8" r="1.5" />
                <circle cx="8" cy="13" r="1.5" />
              </svg>
            </button>
            {isOpen && (
              <ul
                ref={(el) => { actionMenuRefs.current[row.id] = el; }}
                role="menu"
                aria-label={getActionMenuAriaLabel(rowLabel)}
                className="ui-data-table-action-menu"
                onKeyDown={(e) => {
                  const action = getActionMenuKeyAction(e.key);
                  const items = Array.from(
                    actionMenuRefs.current[row.id]?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []
                  );
                  const focused = document.activeElement as HTMLButtonElement;
                  const idx = items.indexOf(focused);
                  if (action === 'close') {
                    e.preventDefault();
                    handleCloseActionMenu(row.id);
                  } else if (action === 'focus-next') {
                    e.preventDefault();
                    items[(idx + 1) % items.length]?.focus();
                  } else if (action === 'focus-prev') {
                    e.preventDefault();
                    items[(idx - 1 + items.length) % items.length]?.focus();
                  } else if (action === 'focus-first') {
                    e.preventDefault();
                    items[0]?.focus();
                  } else if (action === 'focus-last') {
                    e.preventDefault();
                    items[items.length - 1]?.focus();
                  }
                }}
              >
                {(column.actions ?? []).map((item) => (
                  <li key={item.key} role="none">
                    <button
                      role="menuitem"
                      type="button"
                      className="ui-data-table-action-menu-item"
                      onClick={() => {
                        onActionSelect?.(row.id, item.key);
                        handleCloseActionMenu(row.id);
                      }}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </td>
        );
      }

      default:
        return <td key={column.key}>{String(rawValue ?? '')}</td>;
    }
  }

  return (
    <table
      className={cn('ui-data-table', className)}
      data-variant={striped ? 'striped' : 'default'}
    >
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr>
          <th scope="col" className="ui-data-table-checkbox-cell">
            <input
              type="checkbox"
              className="ui-data-table-checkbox"
              checked={selectionState.allSelected}
              ref={(el) => {
                if (el) el.indeterminate = selectionState.someSelected;
              }}
              aria-label={getSelectAllAriaLabel(
                selectionState.allSelected,
                selectionState.someSelected
              )}
              onChange={handleSelectAll}
            />
          </th>
          {columns.map((col) => (
            <th
              key={col.key}
              scope="col"
              aria-sort={col.sortable ? getAriaSortValue(col.key, sortConfig) : undefined}
              tabIndex={col.sortable ? 0 : undefined}
              style={col.width ? { width: col.width } : undefined}
              onClick={col.sortable ? () => handleSort(col.key) : undefined}
              onKeyDown={
                col.sortable
                  ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSort(col.key); } }
                  : undefined
              }
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const isSelected = selectedIds.has(row.id);
          const rowLabel = String(row.id);
          return (
            <tr
              key={row.id}
              aria-selected={isSelected}
              onKeyDown={(e) => {
                if (e.key === ' ' && e.target === e.currentTarget) {
                  e.preventDefault();
                  handleRowSelect(row.id);
                }
              }}
            >
              <td className="ui-data-table-checkbox-cell">
                <input
                  type="checkbox"
                  className="ui-data-table-checkbox"
                  checked={isSelected}
                  aria-label={getCheckboxAriaLabel(rowLabel, isSelected)}
                  onChange={() => handleRowSelect(row.id)}
                />
              </td>
              {columns.map((col) => renderCell(col, row))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
