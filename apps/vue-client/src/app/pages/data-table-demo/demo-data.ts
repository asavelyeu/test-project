import type { ColumnConfig } from '@test-project/data-table';

/**
 * Demo domain types — Students dataset.
 *
 * These interfaces live under pages/ and MUST NOT be imported by anything
 * in lib/. Column `key` values are type-checked via ColumnConfig<T> generic.
 */
export interface StudentRow {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly group: string;
  readonly enrollmentYear: string;
}

/**
 * Demo domain types — Users dataset.
 *
 * Structurally different from StudentRow: three fields vs five, different
 * field names. Demonstrates the Data Table organism works with any row shape.
 */
export interface UserRow {
  readonly username: string;
  readonly email: string;
  readonly role: string;
}

// ---------------------------------------------------------------------------
// Students dataset
// ---------------------------------------------------------------------------

export const STUDENT_ROWS: readonly StudentRow[] = [
  { id: 'S001', firstName: 'Alice', lastName: 'Nguyen', group: 'CS-201', enrollmentYear: '2022' },
  { id: 'S002', firstName: 'Ben', lastName: 'Kowalski', group: 'CS-201', enrollmentYear: '2022' },
  { id: 'S003', firstName: 'Caro', lastName: 'Delgado', group: 'DS-101', enrollmentYear: '2023' },
  { id: 'S004', firstName: 'David', lastName: 'Park', group: 'DS-101', enrollmentYear: '2023' },
  { id: 'S005', firstName: 'Elena', lastName: 'Fischer', group: 'CS-301', enrollmentYear: '2021' },
];

export const STUDENT_COLUMNS: readonly ColumnConfig<StudentRow>[] = [
  { type: 'text', key: 'id', header: 'ID' },
  { type: 'text', key: 'firstName', header: 'First Name' },
  { type: 'text', key: 'lastName', header: 'Last Name' },
  { type: 'text', key: 'group', header: 'Group' },
  { type: 'text', key: 'enrollmentYear', header: 'Enrollment Year' },
];

// ---------------------------------------------------------------------------
// Users dataset
// ---------------------------------------------------------------------------

export const USER_ROWS: readonly UserRow[] = [
  { username: 'alice.nguyen', email: 'alice@example.com', role: 'Admin' },
  { username: 'ben.kowalski', email: 'ben@example.com', role: 'Editor' },
  { username: 'caro.delgado', email: 'caro@example.com', role: 'Viewer' },
];

export const USER_COLUMNS: readonly ColumnConfig<UserRow>[] = [
  { type: 'text', key: 'username', header: 'Username' },
  { type: 'text', key: 'email', header: 'Email' },
  { type: 'text', key: 'role', header: 'Role' },
];
