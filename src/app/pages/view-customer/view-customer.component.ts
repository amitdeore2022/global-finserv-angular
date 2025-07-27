import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CustomerService, Customer } from '../../services/customer.service';
import { InvoiceService, Invoice } from '../../services/invoice.service';
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
    private customerService: CustomerService,
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
      
      // Calculate stats for each customer with robust validation
      this.customers = customers.map(customer => {
        // Normalize customer mobile for comparison (digits only for reliable matching)
        const customerMobileDigits = customer.mobile.replace(/\D/g, '');
        
        const customerInvoices = this.allInvoices.filter(invoice => {
          if (!invoice?.customer?.mobile) return false;
          
          // Use digits-only comparison for reliable mobile number matching
          const invoiceMobileDigits = invoice.customer.mobile.replace(/\D/g, '');
          return invoiceMobileDigits === customerMobileDigits && customerMobileDigits.length >= 10;
        });
        
        // Remove duplicate invoices based on invoice number
        const uniqueInvoices = customerInvoices.filter((invoice, index, self) => 
          index === self.findIndex(i => i.invoiceNumber === invoice.invoiceNumber)
        );
        
        // Calculate totals with proper number validation
        const totalTransactionAmount = uniqueInvoices.reduce((sum, invoice) => {
          const amount = Number(invoice.totalAmount) || 0;
          return sum + amount;
        }, 0);
        
        const totalDueAmount = uniqueInvoices.reduce((sum, invoice) => {
          const due = Number(invoice.balancePayable) || 0;
          return sum + due;
        }, 0);
        
        return {
          ...customer,
          totalTransactionAmount: Math.round(totalTransactionAmount * 100) / 100,
          totalDueAmount: Math.round(totalDueAmount * 100) / 100,
          invoiceCount: uniqueInvoices.length
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

  // Method to refresh data
  async refreshData() {
    await this.loadCustomersWithStats();
  }

  // Calculated totals for filtered customers with validation
  get totalTransactionAmount(): number {
    const total = this.filteredCustomers.reduce((sum, customer) => {
      const amount = Number(customer.totalTransactionAmount) || 0;
      return sum + amount;
    }, 0);
    return Math.round(total * 100) / 100;
  }

  get totalDueAmount(): number {
    const total = this.filteredCustomers.reduce((sum, customer) => {
      const amount = Number(customer.totalDueAmount) || 0;
      return sum + amount;
    }, 0);
    return Math.round(total * 100) / 100;
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
      // Get all invoices for this customer
      const customerInvoices = this.allInvoices.filter(
        invoice => invoice.customer.mobile === customer.mobile
      );

      if (customerInvoices.length === 0) {
        alert('No transactions found for this customer.');
        return;
      }

      // Generate and download ledger using the new service
      this.ledgerService.generateCustomerLedger(customer, customerInvoices);
      
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
    const searchTerm = this.customerSearchTerm.trim();
    
    // If search term is empty, show all customers
    if (!searchTerm) {
      this.filteredCustomers = [...this.customers];
      return;
    }
    
    const searchLower = searchTerm.toLowerCase();
    
    this.filteredCustomers = this.customers.filter(customer => {
      // For name search: require at least 3 letters
      const nameMatch = searchTerm.length >= 3 && 
        customer.name.toLowerCase().includes(searchLower);
      
      // For mobile search: require at least 4 digits (extract only digits)
      const searchDigits = searchTerm.replace(/\D/g, ''); // Remove non-digits
      const mobileMatch = searchDigits.length >= 4 && 
        customer.mobile.replace(/\D/g, '').includes(searchDigits);
      
      // For other fields: immediate search
      const emailMatch = customer.email && 
        customer.email.toLowerCase().includes(searchLower);
      
      const addressMatch = customer.address && 
        customer.address.toLowerCase().includes(searchLower);
      
      const gstMatch = customer.gst && 
        customer.gst.toLowerCase().includes(searchLower);
      
      return nameMatch || mobileMatch || emailMatch || addressMatch || gstMatch;
    });
  }

  clearSearch() {
    this.customerSearchTerm = '';
    this.filteredCustomers = [...this.customers];
  }

  // Test method
  testLedgerService() {
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
    const customer = this.customers.find(c => c.id === customerId);
    if (!customer) {
      alert('Customer not found!');
      return;
    }

    // Create detailed warning message
    const warningMessage = `⚠️ DELETE CUSTOMER WARNING ⚠️

Are you absolutely sure you want to delete this customer?

Customer: ${customer.name}
Mobile: ${customer.mobile}
${customer.email ? 'Email: ' + customer.email : ''}

This action will permanently delete:
• Customer profile and contact information
• ${customer.invoiceCount} invoice(s) worth ₹${customer.totalTransactionAmount.toLocaleString('en-IN')}
• Outstanding dues of ₹${customer.totalDueAmount.toLocaleString('en-IN')}
• All transaction history and records

⚠️ THIS ACTION CANNOT BE UNDONE! ⚠️

Type "DELETE" in the prompt below to confirm deletion.`;

    if (confirm(warningMessage)) {
      const userInput = prompt('Type "DELETE" to confirm permanent deletion:');
      if (userInput === 'DELETE') {
        try {
          await this.customerService.deleteCustomer(customerId);
          await this.loadCustomersWithStats(); // Reload the list
          alert(`Customer "${customer.name}" and all associated data have been permanently deleted.`);
        } catch (error) {
          console.error('Error deleting customer:', error);
          alert('Error deleting customer. Please try again.');
        }
      } else if (userInput !== null) {
        alert('Deletion cancelled. You must type "DELETE" exactly to confirm.');
      }
    }
  }
}
