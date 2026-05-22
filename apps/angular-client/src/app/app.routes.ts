import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/data-table-demo/data-table-demo.page').then(
        (m) => m.DataTableDemoPage,
      ),
  },
];
