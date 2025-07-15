import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';

  constructor(private auth: Auth, private router: Router) {}

  async login() {
    this.errorMessage = '';
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        this.email,
        this.password
      );
      console.log('✅ Logged in:', userCredential.user);
      
      // Store user information for the welcome message
      const user = userCredential.user;
      const userData = {
        username: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email,
        uid: user.uid
      };
      
      localStorage.setItem('currentUser', JSON.stringify(userData));
      localStorage.setItem('username', userData.username);
      
      this.errorMessage = 'login successful';
      this.router.navigate(['/dashboard']); // ✅ REDIRECT
    } catch (error: any) {
      console.error('❌ Login error:', error.message);
      this.errorMessage = 'Invalid email or password';
    }
  }
}
