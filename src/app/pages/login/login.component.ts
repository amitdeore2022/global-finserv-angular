import { Component, OnInit } from '@angular/core';
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
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  errorMessage = '';
  showForgotMessage = false;
  deferredPrompt: any = null;
  showInstallButton = false;

  constructor(private auth: Auth, private router: Router) {}

  ngOnInit() {
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Store the event so it can be triggered later
      this.deferredPrompt = e;
      // Show install button
      this.showInstallButton = true;
    });

    // Check if app is already installed
    window.addEventListener('appinstalled', () => {
      this.showInstallButton = false;
      this.deferredPrompt = null;
    });
  }

  async installApp() {
    if (this.deferredPrompt) {
      // Show the install prompt
      this.deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('✅ PWA installed successfully');
      } else {
        console.log('❌ PWA installation dismissed');
      }
      
      // Reset the deferred prompt
      this.deferredPrompt = null;
      this.showInstallButton = false;
    }
  }

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

  showForgotPasswordMessage(event: Event) {
    event.preventDefault();
    this.showForgotMessage = true;
    this.errorMessage = ''; // Clear any existing error messages
    
    // Hide the message after 5 seconds
    setTimeout(() => {
      this.showForgotMessage = false;
    }, 5000);
  }
}
