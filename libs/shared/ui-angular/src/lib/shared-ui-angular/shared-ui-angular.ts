import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'lib-shared-ui-angular',
  imports: [],
  templateUrl: './shared-ui-angular.html',
  styleUrl: './shared-ui-angular.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharedUiAngular {}
