import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { InvoiceService } from '../../services/invoice.service';
import { CustomerService } from '../../services/customer.service';
import { DeviceDetectionService } from '../../services/device-detection.service';

@Component({
  selector: 'app-quick-stats',
  imports: [CommonModule, DecimalPipe],
  templateUrl: './quick-stats.component.html',
  styleUrl: './quick-stats.component.css'
})
export class QuickStatsComponent implements OnInit {
  totalRevenue: number = 0;
  outstandingAmount: number = 0;
  collectionRate: number = 0;
  totalCustomers: number = 0;
  totalInvoices: number = 0;

  constructor(
    private router: Router,
    private invoiceService: InvoiceService,
    private customerService: CustomerService,
    public deviceDetection: DeviceDetectionService
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  goBack(): void {
    this.router.navigate(['/dashboard'], { queryParams: { category: 'stats' } });
  }

  navigateToViewCustomers(): void {
    this.router.navigate(['/view-customers']);
  }

  navigateToViewInvoices(): void {
    this.router.navigate(['/view-invoices']);
  }

  async loadStats(): Promise<void> {
    try {
      // Load invoices and customers
      const invoices = await this.invoiceService.getInvoices();
      const customers = await this.customerService.getCustomers();

      // Calculate stats
      this.totalCustomers = customers.length;
      this.totalInvoices = invoices.length;
      
      this.totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
      this.outstandingAmount = invoices.reduce((sum, invoice) => sum + invoice.balancePayable, 0);
      
      // Calculate collection rate
      const totalCollected = this.totalRevenue - this.outstandingAmount;
      this.collectionRate = this.totalRevenue > 0 ? (totalCollected / this.totalRevenue) * 100 : 0;
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }
}
