
import { Component } from '@angular/core';
import{NgForm} from '@angular/forms';
import { Router } from '@angular/router';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms'; // Important for ngModel

import Swal from 'sweetalert2';

import { AuthService } from '../services/auth.service'; // Adjust path if needed
 
@Component({

  selector: 'app-login',

  standalone: true,

  imports: [CommonModule, FormsModule], // FormsModule added here

  templateUrl: './login.component.html',

  styleUrls: ['./login.component.css']

})

export class LoginComponent {
 
  email: string = '';

  password: string = '';
 
  constructor(private router: Router, private authService: AuthService) {}
 
  login(form: NgForm) {

    if (form.valid) {

      this.authService.login(this.email, this.password);

    } else {

      console.log('Form is invalid');

    }

  }
  isEmailValid(email:string):boolean{

    const emailPattern = /^[a-zA-Z0-9._%+-]+@gmail\.$/;

    return emailPattern.test(email);

  }
 
  goToRegister() {

    this.router.navigate(['/register']);

  }

}

 
 
 

 
 
 

 

 







