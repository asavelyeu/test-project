import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SharedUiAngular } from './shared-ui-angular';

describe('SharedUiAngular', () => {
  let component: SharedUiAngular;
  let fixture: ComponentFixture<SharedUiAngular>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedUiAngular],
    }).compileComponents();

    fixture = TestBed.createComponent(SharedUiAngular);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
