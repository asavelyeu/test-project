import React from 'react';

import { DataTableDemoPage } from './pages/data-table-demo';

export function App(): React.ReactElement {
  return (
    <div className="min-h-screen bg-slate-50">
      <DataTableDemoPage />
    </div>
  );
}

export default App;
