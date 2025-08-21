import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http'; // Import HttpClient

import { Router } from '@angular/router'; // Import Router

import Swal from 'sweetalert2'; // Import SweetAlert2

import { catchError } from 'rxjs/operators';

import { of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:5172/Auth'; // .NET backend URL

  constructor(private http: HttpClient, private router: Router) {}

  // Login method

  login(email: string, password: string): any {
    this.http
      .post(
        `${this.apiUrl}/login`,
        { email: email, password: password },
        { responseType: 'text' }
      )

      .pipe(
        catchError((error) => {
          Swal.fire({
            icon: 'error',

            title: 'Login failed',

            text: error.error || 'Something went wrong.',
          });

          return of(null); // Return observable to prevent crash
        })
      )

      .subscribe((response) => {
        // Store token in local storage
        
        if (response) {
          const parsedResponse = JSON.parse(response);
          localStorage.setItem('token', parsedResponse.Token);
          localStorage.setItem('userEmail', email);

          Swal.fire({
            icon: 'success',

            title: 'Login successful',

            text: 'You will be redirected to the dashboard.',

            timer: 2000,

            showConfirmButton: false,
          });

          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 2000);
        }
      });
  }

  getToken(): string | null {
    console.log('Getting token from local storage...');
    return localStorage.getItem('token'); // Get token from local storage
  }

  // Register method

  register(email: string, password: string): void {
    this.http
      .post(
        `${this.apiUrl}/register`,
        { email: email, password: password },
        { responseType: 'text' }
      )

      .pipe(
        catchError((error) => {
          Swal.fire({
            icon: 'error',

            title: 'Registration failed',

            text: error.error || 'Something went wrong.',
          });

          return of(null);
        })
      )

      .subscribe((response) => {
        if (response) {
          Swal.fire({
            icon: 'success',

            title: 'Registration successful!',

            text: 'You can now log in with your account.',

            showConfirmButton: true,
          });
        }
      });
  }
}
