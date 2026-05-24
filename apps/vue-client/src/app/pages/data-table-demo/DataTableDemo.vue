<script setup lang="ts">
/**
 * DataTableDemo — concrete page instance.
 *
 * Renders two Data Table instances with structurally different datasets
 * (Students: 5 columns; Users: 3 columns) to exercise the generic
 * ColumnConfig<T> contract and verify cross-shape portability (US-01 / US-08).
 *
 * Hover over any row to see the Hover State (US-04) — pure CSS, no JS.
 *
 * Layer: src/app/pages — concrete page with domain data. Domain types
 * (StudentRow, UserRow) are imported only from demo-data.ts in the same
 * folder and MUST NOT flow into lib/.
 *
 * No composables: demo data and column configs are module-level constants.
 */
import DataTable from '../../lib/organisms/data-table/DataTable.vue';
import {
  STUDENT_COLUMNS,
  STUDENT_ROWS,
  USER_COLUMNS,
  USER_ROWS,
} from './demo-data';
</script>

<template>
  <main class="min-h-screen bg-slate-50 px-6 py-10">
    <h1 class="mb-8 text-2xl font-semibold text-slate-900">
      Data Table — Demo
    </h1>

    <!-- Students dataset — 5 columns (US-01, US-03, US-04, US-08) -->
    <section class="mb-12">
      <h2 class="mb-2 text-lg font-medium text-slate-700">Students</h2>
      <p class="mb-4 text-sm text-slate-500">
        Five-column dataset. Hover a row to see the Hover State (US-04).
      </p>
      <div
        class="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm"
      >
        <DataTable :columns="STUDENT_COLUMNS" :data="STUDENT_ROWS" />
      </div>
    </section>

    <!-- Users dataset — 3 columns (US-08: same component, different shape) -->
    <section>
      <h2 class="mb-2 text-lg font-medium text-slate-700">Users</h2>
      <p class="mb-4 text-sm text-slate-500">
        Three-column dataset. Demonstrates domain-agnostic reusability.
      </p>
      <div
        class="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm"
      >
        <DataTable :columns="USER_COLUMNS" :data="USER_ROWS" />
      </div>
    </section>
  </main>
</template>
