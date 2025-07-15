// src/app/app.component.ts
import { Component } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  constructor(private router: Router) {}

  navigateToHome(): void {
    this.router.navigate(['/dashboard']);
  }

  showHomeButton(): boolean {
    // Show home button on all pages except login and the dashboard itself
    const currentUrl = this.router.url;
    return currentUrl !== '/login' && currentUrl !== '/dashboard' && currentUrl !== '/' && currentUrl !== '';
  }
}
