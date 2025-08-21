// stock-prediction.service.ts
 
import { Injectable } from '@angular/core';
 
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
 
import { Router } from '@angular/router';
 
import Swal from 'sweetalert2';
 
import { catchError, tap } from 'rxjs/operators';
 
import { Observable, of } from 'rxjs';
 
import { environment } from '../../environments/environment';
 
@Injectable({
 
  providedIn: 'root'
 
})
 
export class StockPredictionService {
 
  private apiUrl = `${environment.apiUrl}/api/stockprediction`;
 
  private httpOptions = {
 
    headers: {
 
      'Content-Type': 'application/json',
 
      'Authorization': `Bearer ${localStorage.getItem('token')}`
 
    }
 
  };
 
  constructor(
 
    private http: HttpClient,
 
    private router: Router
 
  ) { }
 
  trainModel(): Observable<any> {
 
    console.log('Sending training request to:', this.apiUrl + '/train');
 
    return this.http.post(`${this.apiUrl}/train`, {}, this.httpOptions).pipe(
 
      tap(response => console.log('Training response:', response)),
 
      catchError((error: HttpErrorResponse) => {
 
        console.error('Training error:', error);
 
        this.handleError(error, 'Training failed');
 
        return of(null);
 
      })
 
    );
 
  }
 
  predictStock(input: StockPredictionInput): Observable<{prediction: number}> {
 
    console.log('Sending prediction request:', input);
 
    return this.http.post<{prediction: number}>(
 
      `${this.apiUrl}/predict`,
 
      input,
 
      this.httpOptions
 
    ).pipe(
 
      tap(response => console.log('Prediction response:', response)),
 
      catchError((error: HttpErrorResponse) => {
 
        console.error('Prediction error:', error);
 
        this.handleError(error, 'Prediction failed');
 
        return of({prediction: NaN});
 
      })
 
    );
 
  }
 
  private handleError(error: HttpErrorResponse, customMessage?: string): void {
 
    console.error('Full error:', error);
 
    let errorMessage = error.error?.error || error.message || 'Unknown error occurred';
 
    Swal.fire({
 
      icon: 'error',
 
      title: customMessage || 'Request failed',
 
      text: errorMessage,
 
      footer: `Status: ${error.status}`
 
    });
 
    if (error.status === 401) {
 
      this.router.navigate(['/login']);
 
    }
 
  }
 
}
 
export interface StockPredictionInput {
 
  open: number;
 
  high: number;
 
  low: number;
 
  volume: number;
 
}
 
 