import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiAdvisor } from './ai-advisor';

describe('AiAdvisor', () => {
  let component: AiAdvisor;
  let fixture: ComponentFixture<AiAdvisor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiAdvisor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiAdvisor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
