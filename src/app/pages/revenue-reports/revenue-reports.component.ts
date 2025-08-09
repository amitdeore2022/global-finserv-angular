import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { InvoiceService } from '../../services/invoice.service';
import { CustomerService } from '../../services/customer.service';
import { DeviceDetectionService } from '../../services/device-detection.service';

@Component({
  selector: 'app-revenue-reports',
  imports: [CommonModule, DecimalPipe],
  templateUrl: './revenue-reports.component.html',
  styleUrl: './revenue-reports.component.css'
})
export class RevenueReportsComponent implements OnInit {
  activeSection: string = '';
  
  // Data properties
  totalRevenue: number = 0;
  outstandingAmount: number = 0;
  collectionRate: number = 0;
  customers: any[] = [];
  invoices: any[] = [];
  
  // Coming soon popup
  showComingSoonPopup: boolean = false;
  comingSoonFeature: string = '';

  constructor(
    private router: Router,
    private invoiceService: InvoiceService,
    private customerService: CustomerService,
    public deviceDetection: DeviceDetectionService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  goBack(): void {
    this.router.navigate(['/dashboard'], { queryParams: { category: 'revenue' } });
  }

  setActiveSection(section: string): void {
    this.activeSection = section;
  }

  async loadData(): Promise<void> {
    try {
      // Load invoices and customers
      this.invoices = await this.invoiceService.getInvoices();
      this.customers = await this.customerService.getCustomers();

      // Calculate stats
      this.totalRevenue = this.invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
      this.outstandingAmount = this.invoices.reduce((sum, invoice) => sum + invoice.balancePayable, 0);
      
      // Calculate collection rate
      const totalCollected = this.totalRevenue - this.outstandingAmount;
      this.collectionRate = this.totalRevenue > 0 ? (totalCollected / this.totalRevenue) * 100 : 0;
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  getCustomerRevenue(customer: any): number {
    return this.invoices
      .filter(invoice => invoice.customer.id === customer.id)
      .reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  }

  getCustomerInvoiceCount(customer: any): number {
    return this.invoices.filter(invoice => invoice.customer.id === customer.id).length;
  }

  getCustomerOutstanding(customer: any): number {
    return this.invoices
      .filter(invoice => invoice.customer.id === customer.id)
      .reduce((sum, invoice) => sum + invoice.balancePayable, 0);
  }

  showComingSoon(feature: string): void {
    this.comingSoonFeature = feature;
    this.showComingSoonPopup = true;
  }

  closeComingSoonPopup(): void {
    this.showComingSoonPopup = false;
    this.comingSoonFeature = '';
  }
}
