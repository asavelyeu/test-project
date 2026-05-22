/**
 * Data Table Demo page.
 *
 * Concrete page instance that proves US-01: the same DataTableComponent
 * accepts ≥2 different dataset shapes (Students: 5 columns; Users: 3 columns)
 * without any code changes to the organism or lib/.
 *
 * Layer: src/app/pages/data-table-demo/ — domain data lives here.
 * Selector: app-data-table-demo-page.
 *
 * Domain types (Student, User) stay in this pages/ folder.
 * No domain types cross into lib/.
 *
 * Data is static — plain readonly fields. OnPush + static inputs is
 * zoneless-safe without signals.
 *
 * CELL_RENDERER_REGISTRY is already provided at root in app.config.ts.
 * Do NOT re-provide it here.
 */

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DataTableComponent } from '../../lib/organisms/data-table/data-table.component';
import { studentColumns, studentRows } from './students.data';
import { userColumns, userRows } from './users.data';

@Component({
  selector: 'app-data-table-demo-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataTableComponent],
  template: `
    <main class="min-h-screen bg-slate-50 p-8 space-y-12">

      <!-- Students dataset — 5 columns (id, firstName, lastName, group, enrollmentYear) -->
      <section aria-labelledby="students-heading">
        <h2 id="students-heading" class="mb-4 text-lg font-semibold text-slate-800">
          Students
        </h2>
        <div class="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <app-data-table
            [columns]="studentColumns"
            [data]="studentRows"
          />
        </div>
      </section>

      <!-- Users dataset — 3 columns (username, email, role) -->
      <!-- Different field names AND different column count → proof of US-01 portability -->
      <section aria-labelledby="users-heading">
        <h2 id="users-heading" class="mb-4 text-lg font-semibold text-slate-800">
          Users
        </h2>
        <div class="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <app-data-table
            [columns]="userColumns"
            [data]="userRows"
          />
        </div>
      </section>

    </main>
  `,
})
export class DataTableDemoPage {
  // Static readonly fields — no signals needed for demo data.
  // OnPush + static inputs is zoneless-safe.

  /** Column config for the Students dataset (5 columns). */
  readonly studentColumns = studentColumns;

  /** Row data for the Students dataset. */
  readonly studentRows = studentRows;

  /** Column config for the Users dataset (3 columns). */
  readonly userColumns = userColumns;

  /** Row data for the Users dataset. */
  readonly userRows = userRows;
}
