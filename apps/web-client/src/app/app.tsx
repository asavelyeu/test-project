import { useState, useCallback } from 'react';
import { DataTable } from '@test-project/shared-ui';
import type {
  DataTableColumn,
  DataTableRow,
  SortConfig,
} from '@test-project/shared-ui';

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

// NGI-13: Static columns (no getValue) + NGI-14: plain data array
interface City { city: string; country: string; population: number }

const CITY_COLUMNS: DataTableColumn<City>[] = [
  { key: 'city', header: 'City', type: 'text' },
  { key: 'country', header: 'Country', type: 'text' },
  { key: 'population', header: 'Population', type: 'numeric' },
];

const CITY_DATA: City[] = [
  { city: 'Berlin', country: 'Germany', population: 3645000 },
  { city: 'Paris', country: 'France', population: 2161000 },
  { city: 'Tokyo', country: 'Japan', population: 13960000 },
  { city: 'New York', country: 'USA', population: 8336817 },
];

export function App() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig>({ columnKey: 'name', direction: 'asc' });

  // NGI-16: Loading state simulation
  const [isLoading, setIsLoading] = useState(false);
  const [loadedData, setLoadedData] = useState<Employee[] | null>(null);

  const simulateFetch = useCallback(() => {
    setIsLoading(true);
    setLoadedData(null);
    setTimeout(() => {
      setIsLoading(false);
      setLoadedData([
        { name: 'Alice Johnson', initials: 'AJ', role: 'Engineer', department: 'Platform', joined: new Date('2021-03-15'), salary: 120000, status: 'active' },
        { name: 'Bob Smith', initials: 'BS', role: 'Designer', department: 'Product', joined: new Date('2022-07-01'), salary: 98000, status: 'inactive' },
      ]);
    }, 2000);
  }, []);

  const resetDemo = useCallback(() => {
    setIsLoading(false);
    setLoadedData(null);
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '1200px' }}>
      <h1 style={{ marginBottom: '0.25rem', fontSize: '1.5rem', fontWeight: 700 }}>
        React — Data Table Demo
      </h1>
      <p style={{ marginBottom: '2rem', color: '#6B7280', fontSize: '0.875rem' }}>
        Showcasing NGI-12 · NGI-13 · NGI-14 · NGI-15 · NGI-16
      </p>

      <h2 style={{ marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 600, color: '#374151' }}>
        Employee Directory <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(rows prop · custom getValue)</span>
      </h2>
      <p style={{ marginBottom: '0.75rem', color: '#6B7280', fontSize: '0.875rem' }}>
        {selectedIds.size} row{selectedIds.size !== 1 ? 's' : ''} selected · Hover any row to see NGI-15 hover state
      </p>
      <DataTable
        caption="Employee directory"
        columns={COLUMNS}
        rows={ROWS}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        sortConfig={sortConfig}
        onSort={setSortConfig}
        onActionSelect={(rowId, action) => alert(`Action "${action}" on row ${rowId}`)}
        striped
      />

      <h2 style={{ marginTop: '3rem', marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 600, color: '#374151' }}>
        City Population <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(data prop · static columns · no getValue)</span>
      </h2>
      <p style={{ marginBottom: '0.75rem', color: '#6B7280', fontSize: '0.875rem' }}>
        NGI-13: column key auto-resolves cell value · NGI-14: plain <code>data</code> array, no row wrapping
      </p>
      <DataTable
        caption="City population"
        columns={CITY_COLUMNS}
        data={CITY_DATA}
      />

      {/* NGI-16: Empty state demo */}
      <h2 style={{ marginTop: '3rem', marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 600, color: '#374151' }}>
        Empty State <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(NGI-16 · data=[])</span>
      </h2>
      <p style={{ marginBottom: '0.75rem', color: '#6B7280', fontSize: '0.875rem' }}>
        When <code>data</code> is an empty array, a placeholder with icon and message is shown. Column headers remain visible.
      </p>
      <DataTable
        caption="Empty table"
        columns={CITY_COLUMNS}
        data={[]}
      />

      <div style={{ marginTop: '1.5rem' }}>
        <DataTable
          caption="Custom empty message"
          columns={CITY_COLUMNS}
          data={[]}
          emptyMessage="No cities match your search. Try a different filter."
        />
      </div>

      {/* NGI-16: Loading state demo */}
      <h2 style={{ marginTop: '3rem', marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 600, color: '#374151' }}>
        Loading State <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(NGI-16 · loading=true)</span>
      </h2>
      <p style={{ marginBottom: '0.75rem', color: '#6B7280', fontSize: '0.875rem' }}>
        When <code>loading</code> is true, a shimmer skeleton is shown — clearly distinct from the empty state.
        Click the button to simulate a 2-second data fetch.
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <button
          onClick={simulateFetch}
          disabled={isLoading}
          style={{
            padding: '0.375rem 0.75rem', borderRadius: '6px', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
            background: '#7c3aed', color: '#fff', fontSize: '0.875rem', fontWeight: 500, opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? 'Loading…' : '▶ Simulate fetch (2s)'}
        </button>
        <button
          onClick={resetDemo}
          style={{
            padding: '0.375rem 0.75rem', borderRadius: '6px', border: '1px solid #d1d5db', cursor: 'pointer',
            background: '#fff', fontSize: '0.875rem', fontWeight: 500, color: '#374151',
          }}
        >
          Reset
        </button>
      </div>
      <DataTable
        caption="Dynamic employee table"
        columns={COLUMNS}
        data={loadedData ?? []}
        loading={isLoading}
        emptyMessage="Click 'Simulate fetch' above to load data."
      />
    </div>
  );
}

export default App;
