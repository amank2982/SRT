// stock-predictor.component.ts

import { Component } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { CommonModule } from '@angular/common';

import {
  StockPredictionService,
  StockPredictionInput,
} from '../services/stock-predictor.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-stock-predictor',

  standalone: true,

  imports: [FormsModule, CommonModule],

  templateUrl: './stock-predictor.component.html',

  styleUrls: ['./stock-predictor.component.css'],
})
export class StockPredictorComponent {
  prediction: number | null = null;

  input: StockPredictionInput = {
    open: 0,

    high: 0,

    low: 0,

    volume: 0,
  };

  isLoading = false;

  errorMessage = '';

  trainingMetrics: any = null;

  constructor(private stockService: StockPredictionService) {}

  onPredict(): void {
    this.isLoading = true;

    this.errorMessage = '';

    this.prediction = null;

    this.stockService.predictStock(this.input).subscribe({
      next: (response) => {
        this.prediction = response.prediction;

        this.isLoading = false;

        console.log('Prediction successful:', this.prediction);
      },

      error: (err) => {
        this.isLoading = false;

        this.errorMessage = err.message || 'Prediction failed';

        console.error('Prediction error:', err);
      },
    });
  }

  onTrainModel(): void {
    this.isLoading = true;

    this.errorMessage = '';

    this.trainingMetrics = null;

    this.stockService.trainModel().subscribe({
      next: (response) => {
        this.isLoading = false;

        this.trainingMetrics = response;

        console.log('Training successful:', response);

        Swal.fire({
          icon: 'success',

          title: 'Model Trained!',

          text: `R² Score: ${response?.rSquared?.toFixed(
            2
          )} | MAE: ${response?.mae?.toFixed(2)}`,

          timer: 3000,
        });
      },

      error: (err) => {
        this.isLoading = false;

        this.errorMessage = err.message || 'Training failed';

        console.error('Training error:', err);
      },
    });
  }
}
