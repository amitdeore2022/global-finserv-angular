// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MigrationService } from './services/migration.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  constructor(
    private router: Router,
    private migrationService: MigrationService
  ) {}

  ngOnInit() {
    // Clear local storage to ensure we're using Firestore
    this.clearLegacyData();
  }

  private clearLegacyData(): void {
    try {
      // Clear any legacy local storage data
      localStorage.removeItem('customers');
      localStorage.removeItem('invoices');
      localStorage.removeItem('invoiceCounter');
      localStorage.removeItem('lastInvoiceNumber');
      
      console.log('✅ Legacy local storage data cleared - now using Firestore');
    } catch (error) {
      console.warn('Warning: Could not clear local storage:', error);
    }
  }

  navigateToHome(): void {
    this.router.navigate(['/dashboard']);
  }

  showHomeButton(): boolean {
    // Show home button on all pages except login and the dashboard itself
    const currentUrl = this.router.url;
    return currentUrl !== '/login' && currentUrl !== '/dashboard' && currentUrl !== '/' && currentUrl !== '';
  }
}
