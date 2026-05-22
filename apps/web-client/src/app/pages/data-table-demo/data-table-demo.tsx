import React from 'react';

import { DataTable } from '../../lib/organisms/data-table';
import {
  STUDENT_COLUMNS,
  STUDENT_ROWS,
  USER_COLUMNS,
  USER_ROWS,
} from './demo-data';

/**
 * DataTableDemoPage — concrete page instance.
 *
 * Renders two Data Table instances with structurally different datasets
 * (Students: 5 columns; Users: 3 columns) to exercise the generic
 * ColumnConfig<T> contract and verify cross-shape portability.
 *
 * Layer: src/app/pages — concrete page with domain data. Domain types
 * (StudentRow, UserRow) are imported only from demo-data.ts in the same
 * folder and MUST NOT flow into lib/.
 *
 * No hooks: demo data and column configs are module-level constants.
 * No React.memo: no measurement has been done to justify it.
 */
export function DataTableDemoPage(): React.ReactElement {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <h1 className="mb-8 text-2xl font-semibold text-slate-900">
        Data Table — Demo
      </h1>

      {/* Students dataset — 5 columns */}
      <section className="mb-12">
        <h2 className="mb-4 text-lg font-medium text-slate-700">Students</h2>
        <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
          <DataTable columns={STUDENT_COLUMNS} data={STUDENT_ROWS} />
        </div>
      </section>

      {/* Users dataset — 3 columns (structurally different from Students) */}
      <section>
        <h2 className="mb-4 text-lg font-medium text-slate-700">Users</h2>
        <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
          <DataTable columns={USER_COLUMNS} data={USER_ROWS} />
        </div>
      </section>
    </main>
  );
}
