/**
 * Tests for the Data Table organism.
 *
 * Covers US-01, US-02, US-03, US-08, US-09 acceptance criteria.
 *
 * Fixtures use inline, domain-free record shapes — no Student, User,
 * or other domain types are imported here. That is deliberate: this
 * file validates US-08 ("No domain logic, field names, or imports
 * inside the component") at the test boundary.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DataTableComponent } from './data-table.component';
import {
  CELL_RENDERER_REGISTRY,
  DEFAULT_CELL_RENDERER_REGISTRY,
} from '../../framework/cell-registry';
import type { ColumnConfig } from '@test-project/data-table';

// ---------------------------------------------------------------------------
// Domain-free fixture shapes
// ---------------------------------------------------------------------------

/** Generic record shape A — two string fields. */
interface RecordA {
  id: string;
  label: string;
}

/** Generic record shape B — three fields of mixed types. */
interface RecordB {
  code: string;
  title: string;
  count: string; // Text Cell coerces everything to string
}

const COLUMNS_A: readonly ColumnConfig<RecordA>[] = [
  { type: 'text', key: 'id', header: 'ID' },
  { type: 'text', key: 'label', header: 'Label' },
];

const DATA_A: readonly RecordA[] = [
  { id: 'r1', label: 'Alpha' },
  { id: 'r2', label: 'Beta' },
];

const COLUMNS_B: readonly ColumnConfig<RecordB>[] = [
  { type: 'text', key: 'code', header: 'Code' },
  { type: 'text', key: 'title', header: 'Title' },
  { type: 'text', key: 'count', header: 'Count' },
];

const DATA_B: readonly RecordB[] = [
  { code: 'C1', title: 'First', count: '10' },
  { code: 'C2', title: 'Second', count: '20' },
  { code: 'C3', title: 'Third', count: '30' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setupFixture<T extends object>(
  columns: readonly ColumnConfig<T>[],
  data: readonly T[],
): ComponentFixture<DataTableComponent<T>> {
  const fixture = TestBed.createComponent(DataTableComponent<T>);
  fixture.componentRef.setInput('columns', columns);
  fixture.componentRef.setInput('data', data);
  fixture.detectChanges();
  return fixture;
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('DataTableComponent (Data Table organism)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataTableComponent],
      providers: [
        { provide: CELL_RENDERER_REGISTRY, useValue: DEFAULT_CELL_RENDERER_REGISTRY },
      ],
    }).compileComponents();
  });

  // ---- US-01 / US-08: Two structurally different dataset shapes ----

  it('US-01 / US-08: renders RecordA dataset correctly', async () => {
    const fixture = setupFixture(COLUMNS_A, DATA_A);
    await fixture.whenStable();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);

    const firstRowCells = rows[0].querySelectorAll('td');
    expect(firstRowCells[0].textContent.trim()).toBe('r1');
    expect(firstRowCells[1].textContent.trim()).toBe('Alpha');
  });

  it('US-01 / US-08: renders RecordB dataset correctly', async () => {
    const fixture = setupFixture(COLUMNS_B, DATA_B);
    await fixture.whenStable();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);

    const thirdRowCells = rows[2].querySelectorAll('td');
    expect(thirdRowCells[0].textContent.trim()).toBe('C3');
    expect(thirdRowCells[1].textContent.trim()).toBe('Third');
    expect(thirdRowCells[2].textContent.trim()).toBe('30');
  });

  // ---- US-01: Prop-change re-render reflects new data ----

  it('US-01: re-renders when data input changes', async () => {
    const fixture = setupFixture(COLUMNS_A, DATA_A);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(2);

    const newData: readonly RecordA[] = [
      { id: 'x1', label: 'Gamma' },
      { id: 'x2', label: 'Delta' },
      { id: 'x3', label: 'Epsilon' },
    ];
    fixture.componentRef.setInput('data', newData);
    fixture.detectChanges();
    await fixture.whenStable();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);
    expect(rows[0].querySelectorAll('td')[1].textContent.trim()).toBe('Gamma');
  });

  // ---- US-02: Column-change re-render reflects new column order ----

  it('US-02: re-renders when columns input changes (column order flipped)', async () => {
    const fixture = setupFixture(COLUMNS_A, DATA_A);
    await fixture.whenStable();

    // Initially: ID | Label
    let headerCells = fixture.nativeElement.querySelectorAll('thead th');
    expect(headerCells[0].textContent.trim()).toBe('ID');
    expect(headerCells[1].textContent.trim()).toBe('Label');

    // Flip column order: Label | ID
    const flipped: readonly ColumnConfig<RecordA>[] = [
      { type: 'text', key: 'label', header: 'Label' },
      { type: 'text', key: 'id', header: 'ID' },
    ];
    fixture.componentRef.setInput('columns', flipped);
    fixture.detectChanges();
    await fixture.whenStable();

    headerCells = fixture.nativeElement.querySelectorAll('thead th');
    expect(headerCells[0].textContent.trim()).toBe('Label');
    expect(headerCells[1].textContent.trim()).toBe('ID');
  });

  it('US-02: re-renders when a column is dropped', async () => {
    const fixture = setupFixture(COLUMNS_A, DATA_A);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('thead th').length).toBe(2);

    // Drop Label column
    const singleColumn: readonly ColumnConfig<RecordA>[] = [
      { type: 'text', key: 'id', header: 'ID' },
    ];
    fixture.componentRef.setInput('columns', singleColumn);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('thead th').length).toBe(1);
    expect(
      fixture.nativeElement.querySelector('thead th').textContent.trim(),
    ).toBe('ID');
  });

  // ---- Unknown cell type → dev-mode throw ----

  it('throws in dev mode when cell type is not registered', async () => {
    // This test requires its own isolated TestBed with an empty registry so
    // that every cell-type lookup fails — the shared beforeEach registry
    // already has 'text' registered, which would make this assertion vacuous.
    // TestBed.overrideProvider() is invalid after compileComponents(), so we
    // reset and configure a fresh module here instead.
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [DataTableComponent],
      providers: [
        { provide: CELL_RENDERER_REGISTRY, useValue: new Map() },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DataTableComponent<RecordA>);
    fixture.componentRef.setInput('columns', COLUMNS_A);
    fixture.componentRef.setInput('data', DATA_A);

    // DataTableComponent.rendererFor() throws for unregistered types in dev mode
    expect(() => fixture.componentInstance.rendererFor('text')).toThrow(
      /No renderer registered for cell type "text"/,
    );
  });

  // ---- US-08: No Actions Cell / Selection Cell controls in DOM ----

  it('US-08: no <button>, [role=checkbox], or <input> elements in rendered DOM', async () => {
    const fixture = setupFixture(COLUMNS_A, DATA_A);
    await fixture.whenStable();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('button')).toBeNull();
    expect(el.querySelector('[role="checkbox"]')).toBeNull();
    expect(el.querySelector('input')).toBeNull();
  });

  // ---- US-09: Text Cell renders value through Text primitive ----

  it('US-09: Text Cell renders value through the Text primitive (app-text)', async () => {
    const fixture = setupFixture(COLUMNS_A, DATA_A);
    await fixture.whenStable();

    // The Text Cell renders an <app-text> element
    const textPrimitive = fixture.nativeElement.querySelector('app-text');
    expect(textPrimitive).not.toBeNull();
  });

  // ---- US-03: Row count matches data length ----

  it('US-03: row count matches data array length', async () => {
    const fixture = setupFixture(COLUMNS_B, DATA_B);
    await fixture.whenStable();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(DATA_B.length);
  });

  // ---- US-03: Table Header Cell labels match column headers ----

  it('US-02 / US-03: Table Header Cell labels match column header config', async () => {
    const fixture = setupFixture(COLUMNS_B, DATA_B);
    await fixture.whenStable();

    const headers = fixture.nativeElement.querySelectorAll('thead th');
    expect(headers.length).toBe(3);
    expect(headers[0].textContent.trim()).toBe('Code');
    expect(headers[1].textContent.trim()).toBe('Title');
    expect(headers[2].textContent.trim()).toBe('Count');
  });

  // ---- Native table semantics ----

  it('uses native <table> / <thead> / <tbody> / <tr> / <th> / <td> semantics', async () => {
    const fixture = setupFixture(COLUMNS_A, DATA_A);
    await fixture.whenStable();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('table')).not.toBeNull();
    expect(el.querySelector('thead')).not.toBeNull();
    expect(el.querySelector('tbody')).not.toBeNull();
    expect(el.querySelector('tr')).not.toBeNull();
    expect(el.querySelector('th')).not.toBeNull();
    expect(el.querySelector('td')).not.toBeNull();
  });

  // ---- Empty header renders blank <th>, no key fallback (Decision 3) ----

  it('US-02: a column with header: \'\' renders an empty <th> with no fallback text', async () => {
    interface RecordC { val: string }
    const columns: readonly ColumnConfig<RecordC>[] = [
      { type: 'text', key: 'val', header: 'Value' },
      { type: 'text', key: 'val', header: '' },
    ];
    const data: readonly RecordC[] = [{ val: 'x' }];

    const fixture = TestBed.createComponent(DataTableComponent<RecordC>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('data', data);
    fixture.detectChanges();
    await fixture.whenStable();

    const headers = fixture.nativeElement.querySelectorAll('thead th');
    expect(headers.length).toBe(2);
    expect(headers[1].textContent.trim()).toBe('');
  });
});
