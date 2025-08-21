import { TestBed } from '@angular/core/testing';

import { StockPredictorService } from './services/stock-predictor.service';

describe('StockPredictorService', () => {
  let service: StockPredictorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StockPredictorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
