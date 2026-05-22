/**
 * Students domain data for the Data Table demo.
 *
 * Domain types (Student) and field names live ONLY in pages/.
 * Nothing in lib/ may import from this file.
 *
 * All columns use type: 'text' — the only CellType in scope for NGI-12.
 * Numeric-looking values (enrollmentYear) stay type: 'text' per task brief.
 *
 * US-01 proof: 5-column dataset structurally different from users.data.ts (3 cols).
 */

import type { ColumnConfig } from '@test-project/data-table';

export interface Student {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly group: string;
  readonly enrollmentYear: string;
}

export const studentColumns: readonly ColumnConfig<Student>[] = [
  { type: 'text', key: 'id', header: 'ID' },
  { type: 'text', key: 'firstName', header: 'First Name' },
  { type: 'text', key: 'lastName', header: 'Last Name' },
  { type: 'text', key: 'group', header: 'Group' },
  { type: 'text', key: 'enrollmentYear', header: 'Enrollment Year', align: 'end' },
];

export const studentRows: readonly Student[] = [
  { id: 'S-001', firstName: 'Alice', lastName: 'Harrington', group: 'CS-401', enrollmentYear: '2022' },
  { id: 'S-002', firstName: 'Ben', lastName: 'Okafor', group: 'CS-402', enrollmentYear: '2021' },
  { id: 'S-003', firstName: 'Clara', lastName: 'Mendes', group: 'DS-301', enrollmentYear: '2023' },
  { id: 'S-004', firstName: 'Dmitri', lastName: 'Volkov', group: 'CS-401', enrollmentYear: '2022' },
  { id: 'S-005', firstName: 'Elena', lastName: 'Watanabe', group: 'DS-302', enrollmentYear: '2023' },
];
