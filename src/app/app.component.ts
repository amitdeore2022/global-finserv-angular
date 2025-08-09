// src/app/app.component.ts
import { Component, OnInit, HostListener } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MigrationService } from './services/migration.service';
import { FirestoreSetupService } from './services/firestore-setup.service';
import { DataCleanupService } from './services/data-cleanup.service';
import { LogoutModalComponent } from './components/logout-modal/logout-modal.component';
import { DeviceDetectionService } from './services/device-detection.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, LogoutModalComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  showLogoutModal = false;
  isMobileOrPWA = false;

  constructor(
    private router: Router,
    private migrationService: MigrationService,
    private firestoreSetup: FirestoreSetupService,
    private dataCleanup: DataCleanupService,
    private deviceDetection: DeviceDetectionService
  ) {}

  ngOnInit() {
    // Clear local storage to ensure we're using Firestore
    this.clearLegacyData();
    
    // Initialize Firestore immediately
    this.initializeFirestore();
    
    // Detect if app is running as PWA or on mobile
    this.detectMobileOrPWA();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.detectMobileOrPWA();
  }

  private detectMobileOrPWA(): void {
    this.isMobileOrPWA = this.deviceDetection.isMobileOrPWA();
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
        // Clean up any duplicate invoice numbers first
        await this.dataCleanup.cleanupDuplicateInvoiceNumbers();
        
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

  logout(): void {
    this.showLogoutModal = true;
  }

  onLogoutConfirmed(): void {
    this.showLogoutModal = false;
    // Clear any stored authentication data if needed
    localStorage.clear();
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }

  onLogoutCancelled(): void {
    this.showLogoutModal = false;
  }

  showDashboardButton(): boolean {
    // Show dashboard button on all pages except login and the dashboard itself
    const currentUrl = this.router.url;
    return currentUrl !== '/login' && currentUrl !== '/dashboard' && currentUrl !== '/' && currentUrl !== '';
  }

  showHomeButton(): boolean {
    // Show home button on all pages except login and the dashboard itself
    const currentUrl = this.router.url;
    return currentUrl !== '/login' && currentUrl !== '/dashboard' && currentUrl !== '/' && currentUrl !== '';
  }

  isLoginPage(): boolean {
    // Check if current route is login page
    const currentUrl = this.router.url;
    return currentUrl === '/login' || currentUrl === '/' || currentUrl === '';
  }

  isDashboardPage(): boolean {
    // Check if current route is dashboard page (with or without query parameters)
    const currentUrl = this.router.url;
    const urlWithoutParams = currentUrl.split('?')[0]; // Remove query parameters
    return urlWithoutParams === '/dashboard';
  }

  shouldShowGlobalHeader(): boolean {
    // Always show global header on dashboard page for logout functionality
    if (this.isDashboardPage()) {
      return !this.isLoginPage();
    }
    
    // For other pages: show global header only on desktop web (not mobile or PWA) and not on login page
    return !this.isMobileOrPWA && !this.isLoginPage();
  }
}
