

// import { Component } from '@angular/core';

// import { Router } from '@angular/router';

// import { CommonModule } from '@angular/common';

// import { FormsModule } from '@angular/forms'; // <-- Important for ngModel

// import Swal from 'sweetalert2';

// import { AuthService } from '../services/auth.service'; // Adjust path if needed

 
// @Component({

//   selector: 'app-register',

//   standalone: true,

//   imports: [CommonModule, FormsModule], // <-- FormsModule added here

//   templateUrl: './register.component.html',

//   styleUrls: ['./register.component.css']

// })

// export class RegisterComponent {
 
//   email: string = '';

//   password: string = '';

//   confirmPassword: string = '';
 
//   constructor(private router: Router, private authService: AuthService) {}
 
//   register(form: any) {

//     if (form.valid) {

//       if (this.password === this.confirmPassword) {

//         // Mocking registration logic. You can call actual registration API here.

//         this.authService.register(this.email, this.password);
 
//         Swal.fire({

//           icon: 'success',

//           title: 'Registration Successful!',

//           showConfirmButton: false,

//           timer: 1500

//         });
 
//         this.router.navigate(['/login']);

//       } else {

//         Swal.fire({

//           icon: 'error',

//           title: 'Passwords do not match!',

//           showConfirmButton: true

//         });

//       }

//     } else {

//       console.log('Form is invalid');

//     }

//   }
 
//   goToLogin() {

//     this.router.navigate(['/login']);

//   }

// }

import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms'; // Important for ngModel

import Swal from 'sweetalert2';

import { AuthService } from '../services/auth.service';

import { HttpClientModule } from '@angular/common/http'; // Import HttpClientModule
 
@Component({

  selector: 'app-register',

  standalone: true,

  imports: [CommonModule, FormsModule, HttpClientModule], // FormsModule added here

  templateUrl: './register.component.html',

  styleUrls: ['./register.component.css']

})

export class RegisterComponent {
 
  email: string = '';

  password: string = '';

  confirmPassword: string = '';
 
  constructor(private router: Router, private authService: AuthService) {}
 
  register(form: NgForm) {

    if (form.valid) {
      if (!this.isEmailValid(this.email)) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid Email!',
          text: 'Only Gmail addresses are allowed.',
          showConfirmButton: true
        });
        return;
      }
      if (!this.isPasswordValid(this.password)) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid Password!',
          text: 'Password must include at least one capital letter and one special character.',
          showConfirmButton: true
        });
        return;
      }

      if (this.password === this.confirmPassword) {

        this.authService.register(this.email, this.password);

        Swal.fire({

          icon: 'success',

          title: 'Registration Successful!',

          showConfirmButton: false,

          timer: 1500

        });

        this.router.navigate(['/login']);

      } else {

        Swal.fire({

          icon: 'error',

          title: 'Passwords do not match!',

          showConfirmButton: true

        });

      }

    } else {

      console.log('Form is invalid');

    }

  }
  isEmailValid(email: string): boolean {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    return emailPattern.test(email);
  }
  isPasswordValid(password: string): boolean {
    // Regex to ensure at least one capital letter and one special character
    const passwordPattern = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).+$/;
    return passwordPattern.test(password);
  }
 
  goToLogin() {

    this.router.navigate(['/login']);

  }

}

 
 

 
 