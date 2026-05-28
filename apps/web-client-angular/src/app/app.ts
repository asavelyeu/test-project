import { Component, signal } from '@angular/core';
import { DataTableComponent } from '@test-project/shared-ui-angular';
import type { DataTableColumn, DataTableRow, SortConfig } from '@test-project/shared-ui/core';

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
  { id: '1', data: { name: 'Alice Johnson', initials: 'AJ', role: 'Engineer', department: 'Platform', joined: new Date('2021-03-15'), salary: 120000, status: 'active' } },
  { id: '2', data: { name: 'Bob Smith', initials: 'BS', role: 'Designer', department: 'Product', joined: new Date('2022-07-01'), salary: 98000, status: 'active' } },
  { id: '3', data: { name: 'Carol White', initials: 'CW', role: 'Manager', department: 'Operations', joined: new Date('2020-01-20'), salary: 140000, status: 'active' } },
  { id: '4', data: { name: 'David Lee', initials: 'DL', role: 'Analyst', department: 'Finance', joined: new Date('2023-02-10'), salary: 85000, status: 'inactive' } },
  { id: '5', data: { name: 'Eva Martinez', initials: 'EM', role: 'Engineer', department: 'Platform', joined: new Date('2019-11-05'), salary: 135000, status: 'active' } },
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
  selectedIds = signal<Set<string>>(new Set());
  sortConfig = signal<SortConfig>({ columnKey: 'name', direction: 'asc' });

  get selectionCount() {
    return this.selectedIds().size;
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
}
