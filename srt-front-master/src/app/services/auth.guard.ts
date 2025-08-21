import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
 
@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}
 
  canActivate(): boolean {
    const token = localStorage.getItem('token'); // Check if the JWT token exists
    if (token) {
      return true; // Allow access if the token exists
    } else {
      this.router.navigate(['/login']); // Redirect to login if no token
      return false;
    }
  }
}
 