/**
 * Unit tests for the column configuration contract.
 *
 * Test environment: node (Jest / ts-jest, no DOM).
 * No framework imports. No domain types in assertions.
 *
 * US coverage:
 *   US-01 — Configure Table via columns and data props (column shape)
 *   US-02 — Define static column configuration
 *   US-08 — Domain-agnostic reusable structure
 */

import type {
  CellAlignment,
  CellType,
  ColumnConfig,
  ColumnConfigBase,
  TextColumnConfig,
} from './column-config';

// ---------------------------------------------------------------------------
// Helpers — two structurally distinct row shapes (no domain names)
// ---------------------------------------------------------------------------

interface RowShapeA {
  id: string;
  label: string;
  description: string;
}

interface RowShapeB {
  code: number;
  title: string;
}

// ---------------------------------------------------------------------------
// CellType — canonical discriminator values
// ---------------------------------------------------------------------------

describe('CellType', () => {
  it('US-01: "text" is the only value shipped in NGI-12', () => {
    // This is a compile-time exhaustiveness check expressed as a runtime
    // assertion.  If the union gains a member the switch gains a branch.
    const checkExhaustive = (ct: CellType): string => {
      switch (ct) {
        case 'text':
          return 'text';
      }
    };

    expect(checkExhaustive('text')).toBe('text');
  });

  it('US-01: CellType accepts only canonical string literals — not arbitrary strings', () => {
    // TypeScript will catch non-canonical values at compile time.
    // At runtime we verify a known-good value round-trips correctly.
    const value: CellType = 'text';
    expect(value).toBe('text');
  });
});

// ---------------------------------------------------------------------------
// CellAlignment — exhaustive value check
// ---------------------------------------------------------------------------

describe('CellAlignment', () => {
  it('US-02: accepts start, end, and center', () => {
    const values: CellAlignment[] = ['start', 'end', 'center'];
    expect(values).toHaveLength(3);
    expect(values).toContain('start');
    expect(values).toContain('end');
    expect(values).toContain('center');
  });
});

// ---------------------------------------------------------------------------
// ColumnConfigBase — structural shape
// ---------------------------------------------------------------------------

describe('ColumnConfigBase', () => {
  it('US-02: requires key and header; id and align are optional', () => {
    // Minimal valid base — TypeScript enforces required fields at compile time
    const minimal: ColumnConfigBase<RowShapeA> = {
      key: 'label',
      header: 'Label',
    };
    expect(minimal.key).toBe('label');
    expect(minimal.header).toBe('Label');
    expect(minimal.id).toBeUndefined();
    expect(minimal.align).toBeUndefined();
  });

  it('US-02: accepts id and align when supplied', () => {
    const full: ColumnConfigBase<RowShapeA> = {
      id: 'col-label',
      key: 'label',
      header: 'Label',
      align: 'start',
    };
    expect(full.id).toBe('col-label');
    expect(full.align).toBe('start');
  });

  it('US-08: key is constrained to keys of the generic row type — no domain names inside the library', () => {
    // The generic constraint `keyof T & string` is enforced at compile time.
    // Here we verify that a column for RowShapeB uses RowShapeB keys only.
    const col: ColumnConfigBase<RowShapeB> = {
      key: 'title',
      header: 'Title',
    };
    expect(col.key).toBe('title');
  });
});

// ---------------------------------------------------------------------------
// TextColumnConfig — discriminated member for Text Cell
// ---------------------------------------------------------------------------

describe('TextColumnConfig', () => {
  it('US-09: type discriminant is exactly "text"', () => {
    const col: TextColumnConfig<RowShapeA> = {
      type: 'text',
      key: 'label',
      header: 'Label',
    };
    expect(col.type).toBe('text');
  });

  it('US-09: narrowing via type discriminant produces TextColumnConfig', () => {
    const col: ColumnConfig<RowShapeA> = {
      type: 'text',
      key: 'description',
      header: 'Description',
    };

    if (col.type === 'text') {
      // TypeScript narrows to TextColumnConfig<RowShapeA> here
      expect(col.key).toBe('description');
      expect(col.header).toBe('Description');
    } else {
      fail('Expected type === "text"');
    }
  });

  it('US-09: optional align field is preserved on TextColumnConfig', () => {
    const col: TextColumnConfig<RowShapeA> = {
      type: 'text',
      key: 'label',
      header: 'Label',
      align: 'center',
    };
    expect(col.align).toBe('center');
  });
});

// ---------------------------------------------------------------------------
// ColumnConfig<T> — discriminated union contract
// ---------------------------------------------------------------------------

describe('ColumnConfig discriminated union', () => {
  it('US-01: a columns array for RowShapeA compiles and holds TextColumnConfig members', () => {
    const columns: ReadonlyArray<ColumnConfig<RowShapeA>> = [
      { type: 'text', key: 'id', header: 'ID' },
      { type: 'text', key: 'label', header: 'Label' },
      { type: 'text', key: 'description', header: 'Description' },
    ];

    expect(columns).toHaveLength(3);
    expect(columns[0]?.type).toBe('text');
    expect(columns[1]?.key).toBe('label');
    expect(columns[2]?.header).toBe('Description');
  });

  it('US-01: a columns array for a second, structurally different row shape also compiles', () => {
    // US-01 requires the same component to work for ≥ 2 dataset shapes
    // without code changes. This test is the library-layer evidence of
    // that genericity.
    const columns: ReadonlyArray<ColumnConfig<RowShapeB>> = [
      { type: 'text', key: 'title', header: 'Title' },
    ];

    expect(columns[0]?.key).toBe('title');
  });

  it('US-08: the union carries no domain-specific identifiers — only generic column fields', () => {
    // Structural assertion: every field on ColumnConfig is in the
    // allowed set. Domain names (studentId, courseName, …) must not
    // appear as required fields.
    const col: ColumnConfig<RowShapeA> = {
      type: 'text',
      key: 'label',
      header: 'Label',
    };
    const allowedKeys = new Set(['type', 'id', 'key', 'header', 'align']);
    for (const field of Object.keys(col)) {
      expect(allowedKeys.has(field)).toBe(true);
    }
  });

  it('US-02: column id defaults to undefined when omitted', () => {
    const col: ColumnConfig<RowShapeA> = {
      type: 'text',
      key: 'label',
      header: 'Label',
    };
    expect(col.id).toBeUndefined();
  });

  it('US-02: explicit id is preserved', () => {
    const col: ColumnConfig<RowShapeA> = {
      type: 'text',
      id: 'col-label',
      key: 'label',
      header: 'Label',
    };
    expect(col.id).toBe('col-label');
  });
});
