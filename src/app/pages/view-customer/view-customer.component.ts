import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LocalCustomerService, Customer } from '../../services/local-customer.service';
import { LocalInvoiceService as InvoiceService, Invoice } from '../../services/local-invoice.service';
import { PdfGenerationService } from '../../services/pdf-generation.service';
import { SimpleLedgerService } from '../../services/simple-ledger.service';

interface CustomerWithStats extends Customer {
  totalTransactionAmount: number;
  totalDueAmount: number;
  invoiceCount: number;
}

@Component({
  selector: 'app-view-customer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './view-customer.component.html',
  styleUrls: ['./view-customer.component.css']
})
export class ViewCustomerComponent implements OnInit {
  customers: CustomerWithStats[] = [];
  filteredCustomers: CustomerWithStats[] = [];
  allInvoices: Invoice[] = [];
  isLoading: boolean = true;
  
  // Search functionality
  customerSearchTerm: string = '';
  
  // Track expanded customer cards
  expandedCustomerCards: Set<string> = new Set();

  constructor(
    private router: Router,
    private customerService: LocalCustomerService,
    private invoiceService: InvoiceService,
    private pdfService: PdfGenerationService,
    private ledgerService: SimpleLedgerService
  ) {}

  async ngOnInit() {
    await this.loadCustomersWithStats();
  }

  async loadCustomersWithStats() {
    try {
      this.isLoading = true;
      
      // Load customers and invoices
      const customers = await this.customerService.getCustomers();
      this.allInvoices = await this.invoiceService.getInvoices();
      
      // Calculate stats for each customer
      this.customers = customers.map(customer => {
        const customerInvoices = this.allInvoices.filter(
          invoice => invoice.customer.mobile === customer.mobile
        );
        
        const totalTransactionAmount = customerInvoices.reduce(
          (sum, invoice) => sum + invoice.totalAmount, 0
        );
        
        const totalDueAmount = customerInvoices.reduce(
          (sum, invoice) => sum + invoice.balancePayable, 0
        );
        
        return {
          ...customer,
          totalTransactionAmount,
          totalDueAmount,
          invoiceCount: customerInvoices.length
        };
      });
      
      // Initialize filtered customers
      this.filteredCustomers = [...this.customers];
      
    } catch (error) {
      console.error('Error loading customer data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  // Calculated totals for filtered customers
  get totalTransactionAmount(): number {
    return this.filteredCustomers.reduce((sum, customer) => sum + customer.totalTransactionAmount, 0);
  }

  get totalDueAmount(): number {
    return this.filteredCustomers.reduce((sum, customer) => sum + customer.totalDueAmount, 0);
  }

  // Alternative names for filtered totals (for template clarity)
  get filteredTotalTransactionAmount(): number {
    return this.totalTransactionAmount;
  }

  get filteredTotalDueAmount(): number {
    return this.totalDueAmount;
  }

  viewCustomerInvoices(customer: CustomerWithStats) {
    // Navigate to view invoices page with customer filter
    this.router.navigate(['/view-invoices'], { 
      queryParams: { 
        customer: customer.mobile 
      } 
    });
  }

  async generateCustomerLedger(customer: CustomerWithStats) {
    try {
      console.log('Generating ledger for customer:', customer.name);
      
      // Get all invoices for this customer
      const customerInvoices = this.allInvoices.filter(
        invoice => invoice.customer.mobile === customer.mobile
      );

      console.log('Found invoices for customer:', customerInvoices.length);

      if (customerInvoices.length === 0) {
        alert('No transactions found for this customer.');
        return;
      }

      // Generate and download ledger using the new service
      console.log('Calling ledger service...');
      this.ledgerService.generateCustomerLedger(customer, customerInvoices);
      console.log('Ledger service call completed');
      
    } catch (error) {
      console.error('Error in generateCustomerLedger:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        name: error instanceof Error ? error.name : 'Unknown error type'
      });
      
      let errorMessage = 'Error generating ledger. ';
      if (error instanceof Error) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please check the console for more details.';
      }
      
      alert(errorMessage);
    }
  }

  // Toggle methods for customer cards
  toggleCustomerCardExpansion(customerId: string) {
    if (this.expandedCustomerCards.has(customerId)) {
      this.expandedCustomerCards.delete(customerId);
    } else {
      this.expandedCustomerCards.add(customerId);
    }
  }

  isCustomerCardExpanded(customerId: string): boolean {
    return this.expandedCustomerCards.has(customerId);
  }

  // Search functionality
  onCustomerSearch() {
    this.filterCustomers();
  }

  filterCustomers() {
    this.filteredCustomers = this.customers.filter(customer => {
      const searchTerm = this.customerSearchTerm.toLowerCase();
      return !searchTerm || 
        customer.name.toLowerCase().includes(searchTerm) ||
        customer.mobile.includes(searchTerm) ||
        (customer.email && customer.email.toLowerCase().includes(searchTerm)) ||
        (customer.address && customer.address.toLowerCase().includes(searchTerm)) ||
        (customer.gst && customer.gst.toLowerCase().includes(searchTerm));
    });
  }

  clearSearch() {
    this.customerSearchTerm = '';
    this.filteredCustomers = [...this.customers];
  }

  // Test method
  testLedgerService() {
    console.log('Testing simple ledger service...');
    // Test removed - SimpleLedgerService doesn't have testPDF method
  }

  goBack() {
    this.router.navigate(['/dashboard'], { queryParams: { category: 'customers' } });
  }

  editCustomer(customerId: string) {
    // Navigate to add customer page with edit mode
    this.router.navigate(['/add-customer'], { queryParams: { edit: customerId } });
  }

  async deleteCustomer(customerId: string) {
    if (confirm('Are you sure you want to delete this customer?')) {
      try {
        await this.customerService.deleteCustomer(customerId);
        await this.loadCustomersWithStats(); // Reload the list
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert('Error deleting customer. Please try again.');
      }
    }
  }
}
