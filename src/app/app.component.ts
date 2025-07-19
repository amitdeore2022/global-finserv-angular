// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MigrationService } from './services/migration.service';
import { FirestoreSetupService } from './services/firestore-setup.service';

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
    private migrationService: MigrationService,
    private firestoreSetup: FirestoreSetupService
  ) {}

  async ngOnInit() {
    // Clear local storage to ensure we're using Firestore
    this.clearLegacyData();
    
    // Initialize Firestore collections
    await this.initializeFirestore();
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

  private async initializeFirestore(): Promise<void> {
    try {
      // Test Firestore connection
      const isConnected = await this.firestoreSetup.testFirestoreConnection();
      
      if (isConnected) {
        // Initialize collections with sample data if needed
        await this.firestoreSetup.initializeCollections();
      } else {
        console.warn('⚠️ Firestore connection failed - app may not work properly');
      }
    } catch (error) {
      console.error('❌ Error initializing Firestore:', error);
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
