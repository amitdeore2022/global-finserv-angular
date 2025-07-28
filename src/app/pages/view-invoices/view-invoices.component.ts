import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { InvoiceService, Invoice } from '../../services/invoice.service';
import { PdfGenerationService } from '../../services/pdf-generation.service';
import { NativeShareService } from '../../services/native-share.service';
import { Capacitor } from '@capacitor/core';

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

  // Payment Modal Properties
  showPaymentModal: boolean = false;
  selectedInvoiceForPayment: Invoice | null = null;
  isProcessingPayment: boolean = false;
  paymentForm = {
    amount: 0,
    paymentType: 'Cash',
    paymentDate: '',
    notes: '',
    reference: ''
  };
  paymentTypes = ['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Card', 'Online'];

  // Payment Success Animation Properties
  showPaymentSuccess: boolean = false;
  successPaymentAmount: number = 0;

  constructor(
    private invoiceService: InvoiceService,
    private router: Router,
    private route: ActivatedRoute,
    private pdfService: PdfGenerationService,
    private nativeShareService: NativeShareService
  ) {}

  ngOnInit() {
    // Check for customer filter from query params
    this.route.queryParams.subscribe(params => {
      this.customerFilter = params['customer'] || '';
      console.log('Customer filter from query params:', this.customerFilter);
    });
    
    this.debugInvoices(); // Debug localStorage
    this.loadInvoices().then(() => {
      // Apply customer filter after loading if provided
      if (this.customerFilter) {
        this.applyCustomerFilter();
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
    
    // Recalculate statistics based on filtered results
    this.calculateFilteredStatistics();
  }

  applyCustomerFilter() {
    // Filter invoices to show only those from the specific customer
    console.log('Applying customer filter for mobile:', this.customerFilter);
    this.filteredInvoices = this.invoices.filter(invoice => 
      invoice.customer.mobile === this.customerFilter
    );
    console.log('Filtered invoices for customer:', this.filteredInvoices);
    
    // Set the search term to show the customer mobile in the search box
    this.invoiceSearchTerm = this.customerFilter;
    
    // Recalculate statistics for filtered invoices only
    this.calculateFilteredStatistics();
  }

  calculateFilteredStatistics() {
    // Calculate statistics specifically for filtered invoices (customer-specific)
    this.totalInvoiceAmount = this.filteredInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    this.totalPendingAmount = this.filteredInvoices.reduce((sum, invoice) => sum + invoice.balancePayable, 0);
    this.paidInvoicesCount = this.filteredInvoices.filter(invoice => invoice.status === 'PAID').length;
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

      // Generate PDF blob instead of downloading
      const pdfBlob = await this.generatePDFBlob(invoice);
      
      // Update button text
      if (whatsappButton) {
        whatsappButton.innerHTML = '<i class="fab fa-whatsapp"></i> Opening WhatsApp...';
      }

      // Use native share service for both native and web
      const fileName = `${invoice.customer.name.replace(/[^a-zA-Z0-9]/g, '_')}_${invoice.invoiceNumber}.pdf`;
      
      await this.nativeShareService.shareInvoiceViaWhatsApp(
        pdfBlob,
        fileName,
        invoice.customer.name,
        invoice.customer.mobile,
        invoice.invoiceNumber,
        invoice.totalAmount
      );

      // Reset button after sharing
      setTimeout(() => {
        if (whatsappButton) {
          whatsappButton.disabled = false;
          whatsappButton.innerHTML = '<i class="fab fa-whatsapp"></i> WhatsApp';
        }
      }, 2000);

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

  // Helper method to generate PDF as blob
  private async generatePDFBlob(invoice: any): Promise<Blob> {
    return new Promise((resolve, reject) => {
      try {
        // Import jsPDF dynamically to ensure it's loaded
        import('jspdf').then(({ default: jsPDF }) => {
          const doc = new jsPDF();
          
          // Use the same PDF generation logic as the service
          this.generatePDFContent(doc, invoice);
          
          // Convert to blob
          const pdfBlob = doc.output('blob');
          resolve(pdfBlob);
        }).catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Simplified PDF generation for sharing (you can expand this)
  private generatePDFContent(doc: any, invoice: any): void {
    // Basic PDF content - you can enhance this with your existing PDF generation logic
    doc.setFontSize(20);
    doc.text('INVOICE', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 20, 40);
    doc.text(`Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}`, 20, 50);
    doc.text(`Customer: ${invoice.customer.name}`, 20, 60);
    doc.text(`Mobile: ${invoice.customer.mobile}`, 20, 70);
    doc.text(`Total Amount: ₹${invoice.totalAmount}`, 20, 80);
    doc.text(`Balance: ₹${invoice.balancePayable}`, 20, 90);
    
    // Add services
    let yPos = 110;
    doc.text('Services:', 20, yPos);
    yPos += 10;
    
    invoice.serviceDetails.forEach((service: any, index: number) => {
      doc.text(`${index + 1}. ${service.description} - ₹${service.amount}`, 25, yPos);
      yPos += 8;
    });
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

    // Prevent opening modal if already open
    if (this.showPaymentModal) {
      return;
    }

    // Set up the payment modal
    this.selectedInvoiceForPayment = invoice;
    this.paymentForm = {
      amount: remainingAmount, // Pre-fill with remaining amount
      paymentType: 'Cash',
      paymentDate: new Date().toISOString().split('T')[0], // Today's date
      notes: '',
      reference: ''
    };
    this.showPaymentModal = true;

    console.log('Payment modal opened for invoice:', invoice.invoiceNumber, 'Amount:', remainingAmount);
  }

  closePaymentModal() {
    this.showPaymentModal = false;
    this.selectedInvoiceForPayment = null;
    this.isProcessingPayment = false;
    this.resetPaymentForm();
    console.log('Payment modal closed and form reset');
  }

  resetPaymentForm() {
    this.paymentForm = {
      amount: 0,
      paymentType: 'Cash',
      paymentDate: '',
      notes: '',
      reference: ''
    };
  }

  // Handle payment type change for PWA compatibility
  onPaymentTypeChange(event: any) {
    const value = event.target.value;
    this.paymentForm.paymentType = value;
    
    // Force blur to close mobile dropdown
    if (event.target) {
      event.target.blur();
    }
  }

  async submitPayment() {
    if (!this.selectedInvoiceForPayment) {
      alert('No invoice selected for payment!');
      return;
    }

    // Prevent multiple submissions
    if (this.isProcessingPayment) {
      return;
    }

    // Enhanced validation
    if (!this.paymentForm.amount || this.paymentForm.amount <= 0) {
      alert('Please enter a valid payment amount greater than 0!');
      return;
    }

    if (this.paymentForm.amount > this.selectedInvoiceForPayment.balancePayable) {
      alert(`Payment amount cannot exceed the remaining balance of ₹${this.selectedInvoiceForPayment.balancePayable.toLocaleString('en-IN')}!`);
      return;
    }

    if (!this.paymentForm.paymentDate) {
      alert('Please select a payment date!');
      return;
    }

    // Check if invoice is already fully paid
    if (this.selectedInvoiceForPayment.balancePayable <= 0) {
      alert('This invoice is already fully paid!');
      this.closePaymentModal();
      return;
    }

    this.isProcessingPayment = true;

    try {
      const invoice = this.selectedInvoiceForPayment;
      const paymentAmount = Number(this.paymentForm.amount);
      
      // Double-check the payment amount is valid
      if (isNaN(paymentAmount) || paymentAmount <= 0) {
        alert('Invalid payment amount entered!');
        return;
      }

      const newAdvanceReceived = invoice.advanceReceived + paymentAmount;
      const newBalancePayable = invoice.totalAmount - newAdvanceReceived;
      let newStatus: 'PENDING' | 'PAID' | 'PARTIAL' = 'PARTIAL';
      
      if (newBalancePayable <= 0) {
        newStatus = 'PAID';
      } else if (newAdvanceReceived === 0) {
        newStatus = 'PENDING';
      }

      // Create payment record note
      const paymentNote = `Payment: ₹${paymentAmount.toLocaleString('en-IN')} via ${this.paymentForm.paymentType} on ${this.paymentForm.paymentDate}${this.paymentForm.reference ? ` (Ref: ${this.paymentForm.reference})` : ''}${this.paymentForm.notes ? ` - ${this.paymentForm.notes}` : ''}`;

      await this.invoiceService.updateInvoice(invoice.id!, {
        advanceReceived: newAdvanceReceived,
        balancePayable: newBalancePayable,
        status: newStatus
      });

      // Store the payment amount for success message before closing modal
      const recordedAmount = paymentAmount;
      
      // Close modal and refresh data
      this.closePaymentModal();
      await this.loadInvoices();
      
      // Show success animation instead of alert
      this.successPaymentAmount = recordedAmount;
      this.showPaymentSuccess = true;
      
      // Hide success animation after 3 seconds
      setTimeout(() => {
        this.showPaymentSuccess = false;
      }, 3000);
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Error adding payment. Please try again.');
    } finally {
      this.isProcessingPayment = false;
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
    this.filteredInvoices = [...this.invoices];
    this.calculateStatistics(); // Recalculate for all invoices
    // Update URL to remove customer query param
    this.router.navigate(['/view-invoices']);
  }

  getCustomerNameFromFilter(): string {
    if (!this.customerFilter || this.filteredInvoices.length === 0) {
      return this.customerFilter;
    }
    // Get customer name from the first filtered invoice
    return this.filteredInvoices[0].customer.name;
  }
}
