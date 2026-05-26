/**
 * Tests for the Vue Data Table organism.
 *
 * Covers US-02, US-03, NGI-13 acceptance criteria.
 *
 * Fixtures use inline, domain-free record shapes — no Student, User,
 * or other domain types are imported here (US-08 domain-agnosticism).
 */

import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import type { Component } from 'vue';
import DataTable from './DataTable.vue';
import type { ColumnConfig } from '@test-project/data-table';

// ---------------------------------------------------------------------------
// Fixtures — two structurally different dataset shapes; no domain type imports.
// ---------------------------------------------------------------------------

interface ShapeA {
  title: string;
  score: string;
}

interface ShapeB {
  label: string;
  amount: string;
}

const columnsA: readonly ColumnConfig<ShapeA>[] = [
  { id: 'title', key: 'title', header: 'Title', type: 'text' },
  { id: 'score', key: 'score', header: 'Score', type: 'text' },
];

const dataA: readonly ShapeA[] = [
  { title: 'Alpha', score: '10' },
  { title: 'Beta', score: '20' },
];

const columnsB: readonly ColumnConfig<ShapeB>[] = [
  { id: 'label', key: 'label', header: 'Label', type: 'text' },
  { id: 'amount', key: 'amount', header: 'Amount', type: 'text', align: 'end' },
];

const dataB: readonly ShapeB[] = [
  { label: 'Gamma', amount: '$100' },
  { label: 'Delta', amount: '$200' },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DataTable (Vue organism)', () => {
  // ---- US-03: Basic rendering ----

  it('US-03: renders rows and cells for ShapeA dataset', () => {
    const wrapper = mount(DataTable as Component, { props: { columns: columnsA, data: dataA } });
    expect(wrapper.text()).toContain('Title');
    expect(wrapper.text()).toContain('Alpha');
  });

  it('US-01/US-08: renders rows and cells for ShapeB dataset (domain-agnostic)', () => {
    const wrapper = mount(DataTable as Component, { props: { columns: columnsB, data: dataB } });
    expect(wrapper.text()).toContain('Label');
    expect(wrapper.text()).toContain('Gamma');
  });

  // ---- US-02: Column order (AC2) ----

  it('US-02 (AC2): columns render in declared configuration order', () => {
    const wrapper = mount(DataTable as Component, { props: { columns: columnsA, data: dataA } });
    const headers = wrapper.findAll('thead th');
    expect(headers.length).toBe(columnsA.length);
    expect(headers[0]?.text()).toBe('Title');
    expect(headers[1]?.text()).toBe('Score');
  });

  it('US-02 (AC3): Table Header Cell labels match the header field in config', () => {
    const wrapper = mount(DataTable as Component, { props: { columns: columnsB, data: dataB } });
    const headers = wrapper.findAll('thead th');
    expect(headers[0]?.text()).toBe('Label');
    expect(headers[1]?.text()).toBe('Amount');
  });

  // ---- NGI-13: data-testid hooks ----

  it('NGI-13: data-testid="data-table" is on the <table> element', () => {
    const wrapper = mount(DataTable as Component, { props: { columns: columnsA, data: dataA } });
    const table = wrapper.find('table');
    expect(table.attributes('data-testid')).toBe('data-table');
  });

  it('NGI-13: data-testid="table-header" is on the header <tr>, not on <thead>', () => {
    const wrapper = mount(DataTable as Component, { props: { columns: columnsA, data: dataA } });
    const thead = wrapper.find('thead');
    expect(thead.attributes('data-testid')).toBeUndefined();
    const headerRow = wrapper.find('thead tr');
    expect(headerRow.attributes('data-testid')).toBe('table-header');
  });

  it('NGI-13: data-testid="table-header-cell" is on every <th>, count matches columns.length', () => {
    const wrapper = mount(DataTable as Component, { props: { columns: columnsA, data: dataA } });
    const headerCells = wrapper.findAll('thead th');
    expect(headerCells.length).toBe(columnsA.length);
    headerCells.forEach((th) => {
      expect(th.attributes('data-testid')).toBe('table-header-cell');
    });
  });

  // ---- NGI-13 Decision 3: Empty header ----

  it('NGI-13 Decision 3: empty header: \'\' renders blank <th> with no fallback to key', () => {
    const colsWithBlank: readonly ColumnConfig<ShapeA>[] = [
      { id: 'title', key: 'title', header: 'Title', type: 'text' },
      { id: 'score', key: 'score', header: '', type: 'text' },
    ];
    const wrapper = mount(DataTable as Component, { props: { columns: colsWithBlank, data: dataA } });
    const headers = wrapper.findAll('thead th');
    expect(headers.length).toBe(2);
    expect(headers[1]?.text().trim()).toBe('');
  });
});
