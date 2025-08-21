import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
 
export const TokenInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const swal = Swal;
  const token = auth.getToken();
  
  if (token) {
    request = request.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
 
  return next(request).pipe(
    catchError((err:any)=>{
      if (err instanceof HttpErrorResponse){
        if (err.status === 401){
          swal.fire({
            icon: 'error',
            title: 'Unauthorized',
            text: 'Please log in to access this resource.',
            width: '400px',
            heightAuto: false,
            confirmButtonText: 'OK',
            confirmButtonColor: '#005F83'
          }).then(() => {
            localStorage.clear();
            router.navigate(['/login']);
          });
        }
        return throwError(() => new Error("something went wrong"));
      }
      return throwError(() => new Error("An unexpected error occurred"));
    })
  );
};