import { useCallback, useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type {
  AvatarTextValue,
  DataTableColumn,
  DataTableProps,
  DataTableRow,
  LinkValue,
  IconTextValue,
} from '../../core/data-table/data-table.types';
import {
  clampProgress,
  computeSelectionState,
  formatBoolean,
  formatCurrency,
  formatDate,
  formatNumeric,
  getCellValue,
  getInitials,
  nextSortDirection,
  normalizeRows,
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

const SKELETON_WIDTHS = ['72%', '55%', '80%', '45%', '65%', '50%', '38%', '70%'];

function isAvatarTextValue(val: unknown): val is AvatarTextValue {
  return typeof val === 'object' && val !== null && 'name' in val;
}

function isLinkValue(val: unknown): val is LinkValue {
  return typeof val === 'object' && val !== null && 'href' in val && 'label' in val;
}

function isIconTextValue(val: unknown): val is IconTextValue {
  return typeof val === 'object' && val !== null && 'icon' in val && 'text' in val;
}

export function DataTable<T>({
  columns,
  rows: rowsProp,
  data,
  selectedIds: controlledSelectedIds,
  onSelectionChange,
  onActionSelect,
  onSort,
  sortConfig,
  caption,
  striped = false,
  className,
  loading = false,
  skeletonRowCount = 5,
  emptyMessage = 'No data available',
}: DataTableProps<T>) {
  const rows = rowsProp ?? normalizeRows(data ?? []);
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
    const rawValue = getCellValue(column, row);

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

      case 'text':
        return (
          <td key={column.key} className="ui-data-table-text-cell" title={String(rawValue ?? '')}>
            {String(rawValue ?? '')}
          </td>
        );

      case 'currency':
        return (
          <td key={column.key} className="ui-data-table-currency">
            {formatCurrency(rawValue as number | null | undefined, column.currencyConfig)}
          </td>
        );

      case 'progress': {
        const prog = clampProgress(rawValue as number | null | undefined);
        return (
          <td key={column.key}>
            <div className="ui-data-table-progress-cell">
              <div
                className="ui-data-table-progress-track"
                role="progressbar"
                aria-valuenow={prog.percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${column.header}: ${prog.label}`}
              >
                <div
                  className="ui-data-table-progress-fill"
                  style={{ width: `${prog.percent}%` }}
                />
              </div>
              {column.showProgressLabel !== false && (
                <span className="ui-data-table-progress-label">{prog.label}</span>
              )}
            </div>
          </td>
        );
      }

      case 'link': {
        if (isLinkValue(rawValue)) {
          return (
            <td key={column.key}>
              <a
                className="ui-data-table-link"
                href={rawValue.href}
                target={column.linkTarget ?? '_blank'}
                rel={column.linkTarget === '_self' ? undefined : 'noopener noreferrer'}
              >
                {rawValue.label}
              </a>
            </td>
          );
        }
        return <td key={column.key}>{String(rawValue ?? '')}</td>;
      }

      case 'boolean': {
        const boolResult = formatBoolean(rawValue, column.booleanDisplay);
        return (
          <td key={column.key}>
            <span
              className="ui-data-table-boolean"
              data-state={String(boolResult.state)}
              aria-label={boolResult.label}
            >
              {column.booleanDisplay === 'icon' ? (
                <svg className="ui-data-table-boolean-icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  {boolResult.state ? (
                    <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                  ) : (
                    <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
                  )}
                </svg>
              ) : (
                <span>{boolResult.label}</span>
              )}
            </span>
          </td>
        );
      }

      case 'icon-text': {
        if (isIconTextValue(rawValue)) {
          return (
            <td key={column.key}>
              <div className="ui-data-table-icon-text">
                <span className="ui-data-table-icon-text-icon" aria-hidden="true">
                  {rawValue.icon}
                </span>
                <span>{rawValue.text}</span>
              </div>
            </td>
          );
        }
        return <td key={column.key}>{String(rawValue ?? '')}</td>;
      }

      case 'multiline': {
        const maxLines = column.maxLines ?? 3;
        return (
          <td key={column.key}>
            <div
              className="ui-data-table-multiline"
              style={{ WebkitLineClamp: maxLines } as React.CSSProperties}
            >
              {String(rawValue ?? '')}
            </div>
          </td>
        );
      }

      case 'tags': {
        const tags = Array.isArray(rawValue) ? rawValue : [];
        return (
          <td key={column.key}>
            <div className="ui-data-table-tags">
              {tags.map((tag, i) => (
                <span key={i} className="ui-data-table-tag">
                  {String(tag)}
                </span>
              ))}
            </div>
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
      <tbody aria-busy={loading || undefined} aria-label={loading ? 'Loading data, please wait…' : undefined}>
        {loading ? (
          <>
            {Array.from({ length: skeletonRowCount }, (_, i) => i).map((rowIdx) => (
              <tr key={rowIdx} aria-hidden="true">
                <td className="ui-data-table-checkbox-cell">
                  <span
                    className="ui-data-table-skeleton ui-data-table__skeleton-cell"
                    style={{ width: '16px', display: 'inline-block' }}
                  />
                </td>
                {columns.map((col, colIdx) => (
                  <td key={col.key} className={col.type === 'numeric' ? 'ui-data-table-numeric' : undefined}>
                    <span
                      className="ui-data-table-skeleton ui-data-table__skeleton-cell"
                      style={{
                        width: SKELETON_WIDTHS[(rowIdx * columns.length + colIdx) % SKELETON_WIDTHS.length],
                        animationDelay: `${(rowIdx * columns.length + colIdx) * 0.07}s`,
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </>
        ) : rows.length === 0 ? (
          <tr>
            <td
              className="ui-data-table-empty-cell"
              colSpan={columns.length + 1}
              aria-label={emptyMessage}
            >
              <svg
                className="ui-data-table-empty-icon"
                aria-hidden="true"
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="4" y="8" width="32" height="24" rx="3" />
                <line x1="4" y1="15" x2="36" y2="15" />
                <line x1="13" y1="8" x2="13" y2="32" />
              </svg>
              <span className="ui-data-table-empty-message">{emptyMessage}</span>
            </td>
          </tr>
        ) : (
          rows.map((row) => {
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
        })
        )}
      </tbody>
    </table>
  );
}
