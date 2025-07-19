import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { LocalInvoiceService as InvoiceService, Invoice } from '../../services/local-invoice.service';
import { PdfGenerationService } from '../../services/pdf-generation.service';

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
  isLoading: boolean = true;
  customerFilter: string = ''; // For filtering by customer mobile
  
  // Statistics
  totalInvoiceAmount: number = 0;
  totalPendingAmount: number = 0;
  paidInvoicesCount: number = 0;

  // Track expanded cards
  expandedCards: Set<string> = new Set();

  constructor(
    private invoiceService: InvoiceService,
    private router: Router,
    private route: ActivatedRoute,
    private pdfService: PdfGenerationService
  ) {}

  ngOnInit() {
    // Check for customer filter from query params
    this.route.queryParams.subscribe(params => {
      this.customerFilter = params['customer'] || '';
      if (this.customerFilter) {
        this.invoiceSearchTerm = this.customerFilter;
      }
    });
    
    this.debugInvoices(); // Debug localStorage
    this.loadInvoices().then(() => {
      // Apply filter after loading
      if (this.customerFilter) {
        this.filterInvoices();
      }
    });
  }

  async loadInvoices() {
    try {
      this.isLoading = true;
      console.log('Loading invoices...');
      this.invoices = await this.invoiceService.getInvoices();
      console.log('Loaded invoices:', this.invoices);
      this.filteredInvoices = [...this.invoices];
      this.calculateStatistics();
    } catch (error) {
      console.error('Error loading invoices:', error);
      alert('Error loading invoices. Please refresh the page.');
    } finally {
      this.isLoading = false;
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

  async printInvoice(invoiceId: string) {
    try {
      const invoice = this.invoices.find(inv => inv.id === invoiceId);
      if (invoice) {
        // Show a brief loading indicator
        const button = document.querySelector(`[data-invoice-id="${invoiceId}"][title="Print Invoice"]`) as HTMLButtonElement;
        if (button) {
          button.disabled = true;
          button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        }

        // Generate and download PDF
        this.pdfService.generateInvoicePDF(invoice);
        
        // Reset button after a short delay
        setTimeout(() => {
          if (button) {
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-print"></i> Print';
          }
        }, 2000);
      } else {
        alert('Invoice not found!');
      }
    } catch (error) {
      console.error('Error printing invoice:', error);
      alert('Error generating PDF. Please try again.');
      
      // Reset button on error
      const button = document.querySelector(`[data-invoice-id="${invoiceId}"][title="Print Invoice"]`) as HTMLButtonElement;
      if (button) {
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-print"></i> Print';
      }
    }
  }

  async shareOnWhatsApp(invoiceId: string) {
    try {
      const invoice = this.invoices.find(inv => inv.id === invoiceId);
      if (!invoice) {
        alert('Invoice not found!');
        return;
      }

      // Find and update the WhatsApp button
      const whatsappButton = document.querySelector(`[data-invoice-id="${invoiceId}"][title="Share on WhatsApp"]`) as HTMLButtonElement;
      if (whatsappButton) {
        whatsappButton.disabled = true;
        whatsappButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PDF...';
      }

      // First, download the PDF
      this.pdfService.generateInvoicePDF(invoice);

      // Update button text
      if (whatsappButton) {
        whatsappButton.innerHTML = '<i class="fab fa-whatsapp"></i> Opening WhatsApp...';
      }

      // Wait a moment for the download to start
      setTimeout(() => {
        // Prepare comprehensive WhatsApp message
        const message = `🧾 *Invoice ${invoice.invoiceNumber}*

� Customer: ${invoice.customer.name}
📅 Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}
💰 Total: ₹${invoice.totalAmount.toLocaleString('en-IN')}
💳 Advance: ₹${invoice.advanceReceived.toLocaleString('en-IN')}
🔄 Balance: ₹${invoice.balancePayable.toLocaleString('en-IN')}
📊 Status: *${invoice.status}*

💼 *Services:*
${invoice.serviceDetails.map((service, index) => `${index + 1}. ${service.description} - ₹${service.amount.toLocaleString('en-IN')}`).join('\n')}

🏦 *Payment:*
${invoice.selectedBank}

� *GLOBAL FINANCIAL SERVICES*
☎️ 9623736781 | 9604722533
📍 Nashik - 422003

📄 PDF invoice downloaded to your device. Please attach it manually in WhatsApp by clicking the attachment (📎) button.

Thank you for your business! 🙏`;

        // Open WhatsApp with the message
        const phoneNumber = invoice.customer.mobile.replace(/\D/g, '');
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');

        // Reset button after WhatsApp opens
        setTimeout(() => {
          if (whatsappButton) {
            whatsappButton.disabled = false;
            whatsappButton.innerHTML = '<i class="fab fa-whatsapp"></i> WhatsApp';
          }
        }, 2000);

      }, 1500); // 1.5 second delay to allow PDF download to start

    } catch (error) {
      console.error('Error sharing on WhatsApp:', error);
      alert('Error sharing invoice. Please try again.');
      
      // Reset button on error
      const whatsappButton = document.querySelector(`[data-invoice-id="${invoiceId}"][title="Share on WhatsApp"]`) as HTMLButtonElement;
      if (whatsappButton) {
        whatsappButton.disabled = false;
        whatsappButton.innerHTML = '<i class="fab fa-whatsapp"></i> WhatsApp';
      }
    }
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
    if (!status) return;
    
    try {
      await this.invoiceService.updateInvoice(invoiceId, { status: status as 'PENDING' | 'PAID' | 'PARTIAL' });
      await this.loadInvoices();
    } catch (error) {
      console.error('Error updating invoice status:', error);
      alert('Error updating invoice status. Please try again.');
    }
  }

  addPayment(invoiceId: string) {
    const invoice = this.invoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
      alert('Invoice not found!');
      return;
    }

    const remainingAmount = invoice.balancePayable;
    if (remainingAmount <= 0) {
      alert('This invoice is already fully paid!');
      return;
    }

    const paymentAmount = prompt(`Enter payment amount (Remaining: ₹${remainingAmount.toLocaleString('en-IN')}):`, remainingAmount.toString());
    
    if (paymentAmount === null) return; // User cancelled
    
    const amount = parseFloat(paymentAmount);
    
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid payment amount!');
      return;
    }

    if (amount > remainingAmount) {
      alert('Payment amount cannot exceed the remaining balance!');
      return;
    }

    try {
      const newAdvanceReceived = invoice.advanceReceived + amount;
      const newBalancePayable = invoice.totalAmount - newAdvanceReceived;
      let newStatus: 'PENDING' | 'PAID' | 'PARTIAL' = 'PARTIAL';
      
      if (newBalancePayable <= 0) {
        newStatus = 'PAID';
      } else if (newAdvanceReceived === 0) {
        newStatus = 'PENDING';
      }

      this.invoiceService.updateInvoice(invoiceId, {
        advanceReceived: newAdvanceReceived,
        balancePayable: newBalancePayable,
        status: newStatus
      }).then(() => {
        this.loadInvoices();
        alert(`Payment of ₹${amount.toLocaleString('en-IN')} added successfully!`);
      });
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Error adding payment. Please try again.');
    }
  }

  toggleCardExpansion(invoiceId: string) {
    if (this.expandedCards.has(invoiceId)) {
      this.expandedCards.delete(invoiceId);
    } else {
      this.expandedCards.add(invoiceId);
    }
  }

  isCardExpanded(invoiceId: string): boolean {
    return this.expandedCards.has(invoiceId);
  }

  goBackToDashboard() {
    this.router.navigate(['/dashboard'], { queryParams: { category: 'invoices' } });
  }

  // Debug method to check localStorage
  debugInvoices() {
    const stored = localStorage.getItem('globalfinserv_invoices');
    console.log('Raw localStorage data:', stored);
    console.log('Parsed invoices:', stored ? JSON.parse(stored) : 'No data');
    console.log('Current invoices array:', this.invoices);
    console.log('Filtered invoices array:', this.filteredInvoices);
  }

  clearCustomerFilter() {
    this.customerFilter = '';
    this.invoiceSearchTerm = '';
    this.filterInvoices();
    // Update URL to remove customer query param
    this.router.navigate(['/view-invoices']);
  }
}
