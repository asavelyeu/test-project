/**
 * Users domain data for the Data Table demo.
 *
 * Domain types (User) and field names live ONLY in pages/.
 * Nothing in lib/ may import from this file.
 *
 * All columns use type: 'text' — the only CellType in scope for NGI-12.
 *
 * US-01 proof: 3-column dataset structurally different from students.data.ts (5 cols).
 * Different field names (username, email, role vs id, firstName, lastName, group, enrollmentYear)
 * demonstrate that the same DataTableComponent accepts ≥2 different dataset shapes without
 * code changes.
 */

import type { ColumnConfig } from '@test-project/data-table';

export interface User {
  readonly username: string;
  readonly email: string;
  readonly role: string;
}

export const userColumns: readonly ColumnConfig<User>[] = [
  { type: 'text', key: 'username', header: 'Username' },
  { type: 'text', key: 'email', header: 'Email' },
  { type: 'text', key: 'role', header: 'Role', align: 'center' },
];

export const userRows: readonly User[] = [
  { username: 'aharrington', email: 'alice@example.com', role: 'Admin' },
  { username: 'bokafor', email: 'ben@example.com', role: 'Editor' },
  { username: 'cmendes', email: 'clara@example.com', role: 'Viewer' },
  { username: 'dvolkov', email: 'dmitri@example.com', role: 'Editor' },
  { username: 'ewatanabe', email: 'elena@example.com', role: 'Admin' },
];
