import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LocalInvoiceService as InvoiceService, Invoice } from '../../services/local-invoice.service';

@Component({
  selector: 'app-view-invoices',
  templateUrl: './view-invoices.component.html',
  styleUrls: ['./view-invoices.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule]
})
export class ViewInvoicesComponent implements OnInit {
  invoices: Invoice[] = [];
  filteredInvoices: Invoice[] = [];
  invoiceSearchTerm: string = '';
  selectedInvoiceStatus: string = 'ALL';
  
  // Statistics
  totalInvoiceAmount: number = 0;
  totalPendingAmount: number = 0;
  paidInvoicesCount: number = 0;

  constructor(
    private invoiceService: InvoiceService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadInvoices();
  }

  async loadInvoices() {
    try {
      this.invoices = await this.invoiceService.getInvoices();
      this.filteredInvoices = this.invoices;
      this.calculateStatistics();
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  }

  calculateStatistics() {
    this.totalInvoiceAmount = this.invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    this.totalPendingAmount = this.invoices.reduce((sum, invoice) => sum + invoice.balancePayable, 0);
    this.paidInvoicesCount = this.invoices.filter(invoice => invoice.status === 'PAID').length;
  }

  onInvoiceSearch() {
    this.filterInvoices();
  }

  onStatusFilterChange() {
    this.filterInvoices();
  }

  filterInvoices() {
    this.filteredInvoices = this.invoices.filter(invoice => {
      const matchesSearch = !this.invoiceSearchTerm || 
        invoice.invoiceNumber.toLowerCase().includes(this.invoiceSearchTerm.toLowerCase()) ||
        invoice.customer.name.toLowerCase().includes(this.invoiceSearchTerm.toLowerCase()) ||
        invoice.customer.mobile.includes(this.invoiceSearchTerm);
      
      const matchesStatus = this.selectedInvoiceStatus === 'ALL' || 
        invoice.status === this.selectedInvoiceStatus;

      return matchesSearch && matchesStatus;
    });
  }

  printInvoice(invoiceId: string) {
    console.log('Print invoice:', invoiceId);
    // Implement print functionality
  }

  shareOnWhatsApp(invoiceId: string) {
    console.log('Share on WhatsApp:', invoiceId);
    // Implement WhatsApp sharing functionality
  }

  editInvoice(invoiceId: string) {
    this.router.navigate(['/create-invoice'], { queryParams: { edit: invoiceId } });
  }

  async deleteInvoice(invoiceId: string) {
    if (confirm('Are you sure you want to delete this invoice?')) {
      try {
        await this.invoiceService.deleteInvoice(invoiceId);
        await this.loadInvoices();
      } catch (error) {
        console.error('Error deleting invoice:', error);
      }
    }
  }

  async updateInvoiceStatus(invoiceId: string, status: string) {
    try {
      await this.invoiceService.updateInvoice(invoiceId, { status: status as 'PENDING' | 'PAID' | 'PARTIAL' });
      await this.loadInvoices();
    } catch (error) {
      console.error('Error updating invoice status:', error);
    }
  }

  goBackToDashboard() {
    this.router.navigate(['/dashboard'], { queryParams: { category: 'invoices' } });
  }
}
