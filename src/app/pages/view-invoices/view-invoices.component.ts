import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { InvoiceService, Invoice } from '../../services/invoice.service';
import { PdfGenerationNewService } from '../../services/pdf-generation-new.service';
import { DeviceDetectionService } from '../../services/device-detection.service';

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
    private pdfService: PdfGenerationNewService,
    private pdfNewService: PdfGenerationNewService,
    public deviceDetection: DeviceDetectionService
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
      
      // Sort invoices by date (most recent first)
      this.invoices = this.sortInvoicesByDate(this.invoices);
      
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

  sortInvoicesByDate(invoices: Invoice[]): Invoice[] {
    return invoices.sort((a, b) => {
      // First try to sort by invoiceDate (string format)
      const dateA = new Date(a.invoiceDate);
      const dateB = new Date(b.invoiceDate);
      
      // If both dates are valid, sort by invoice date (most recent first)
      if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
        return dateB.getTime() - dateA.getTime();
      }
      
      // Fallback to createdAt if available
      if (a.createdAt && b.createdAt) {
        const createdA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const createdB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return createdB.getTime() - createdA.getTime();
      }
      
      // If no valid dates, maintain original order
      return 0;
    });
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
    
    // Sort filtered results by date (most recent first)
    this.filteredInvoices = this.sortInvoicesByDate(this.filteredInvoices);
    
    // Recalculate statistics based on filtered results
    this.calculateFilteredStatistics();
  }

  applyCustomerFilter() {
    // Filter invoices to show only those from the specific customer
    console.log('Applying customer filter for mobile:', this.customerFilter);
    this.filteredInvoices = this.invoices.filter(invoice => 
      invoice.customer.mobile === this.customerFilter
    );
    
    // Sort filtered results by date (most recent first)
    this.filteredInvoices = this.sortInvoicesByDate(this.filteredInvoices);
    
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

      // Check if this is iOS PWA
      if (this.isIOSPWA()) {
        // iOS PWA: Use Web Share API to share PDF
        await this.shareViaWebShareAPI(invoice, whatsappButton);
        return;
      }

      // Android/Desktop: Original behavior (download + WhatsApp link)
      await this.shareViaDownloadAndWhatsApp(invoice, whatsappButton, invoiceId);

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

  // Check if running on iOS PWA
  private isIOSPWA(): boolean {
    const userAgent = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  (window.navigator as any).standalone === true;
    return isIOS && isPWA;
  }

  // iOS PWA: Share PDF via Web Share API
  private async shareViaWebShareAPI(invoice: any, whatsappButton: HTMLButtonElement | null) {
    try {
      console.log('📱 iOS PWA detected - using Web Share API');
      
      // Generate PDF blob
      const pdfBlob = this.pdfService.generateInvoicePDFBlob(invoice);
      
      // Create filename
      const customerName = invoice.customer?.name || 'Customer';
      const sanitizedCustomerName = customerName.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${sanitizedCustomerName}_INV_${invoice.invoiceNumber}.pdf`;
      
      // Create File object for sharing
      const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });
      
      // Prepare share data
      const shareData = {
        title: `Invoice ${invoice.invoiceNumber}`,
        text: `Invoice ${invoice.invoiceNumber} for ${invoice.customer.name} - Amount: ₹${invoice.totalAmount.toLocaleString('en-IN')}`,
        files: [pdfFile]
      };

      // Check if Web Share API is available and supports files
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        if (whatsappButton) {
          whatsappButton.innerHTML = '<i class="fas fa-share-alt"></i> Opening Share...';
        }
        
        await navigator.share(shareData);
        console.log('📱 PDF shared successfully via Web Share API');
      } else {
        // Fallback: Show instructions for manual sharing
        if (whatsappButton) {
          whatsappButton.innerHTML = '<i class="fas fa-info-circle"></i> Share Instructions';
        }
        
        alert('iOS PWA Sharing:\n\n1. Use the Safari share button (top-right)\n2. Select "Share PDF"\n3. Choose WhatsApp from the share options\n\nNote: Direct WhatsApp sharing is not supported in iOS PWA mode.');
      }
      
    } catch (error) {
      console.error('Error sharing via Web Share API:', error);
      
      // Show fallback message
      alert('iOS PWA: Please use Safari\'s share button to share this PDF via WhatsApp.\n\nDirect sharing is not supported in PWA mode on iOS.');
    } finally {
      // Reset button
      setTimeout(() => {
        if (whatsappButton) {
          whatsappButton.disabled = false;
          whatsappButton.innerHTML = '<i class="fab fa-whatsapp"></i> WhatsApp';
        }
      }, 2000);
    }
  }

  // Android/Desktop: Original behavior (download + WhatsApp link)
  private async shareViaDownloadAndWhatsApp(invoice: any, whatsappButton: HTMLButtonElement | null, invoiceId: string) {
    // Always generate and download PDF for WhatsApp sharing
    console.log('📄 Generating PDF for WhatsApp sharing...');
    
    // Check if this is the first download for this invoice
    const downloadCountKey = `downloadCount_${invoice.invoiceNumber}`;
    let downloadCount = parseInt(localStorage.getItem(downloadCountKey) || '0');
    const isFirstDownload = downloadCount === 0;
    
    // Generate PDF with blob method
    const pdfBlob = this.pdfService.generateInvoicePDFBlob(invoice);
    
    // Create standard filename
    const customerName = invoice.customer?.name || 'Customer';
    const sanitizedCustomerName = customerName.replace(/[^a-zA-Z0-9]/g, '_');
    const baseFilename = `${sanitizedCustomerName}_INV_${invoice.invoiceNumber}`;
    
    if (isFirstDownload) {
      // First download - normal download
      console.log('📄 First download - normal download method');
      const filename = `${baseFilename}.pdf`;
      const url = window.URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = filename;
      downloadLink.style.display = 'none';
      
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } else {
      // Subsequent downloads - use unique filename with timestamp to avoid browser cache
      const timestamp = Date.now();
      const uniqueFilename = `${baseFilename}_${timestamp}.pdf`;
      
      console.log('📄 Subsequent download - using unique filename to avoid popup');
      
      const url = window.URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = uniqueFilename;
      downloadLink.style.display = 'none';
      downloadLink.style.position = 'absolute';
      downloadLink.style.left = '-9999px';
      downloadLink.style.visibility = 'hidden';
      
      // Add random attribute to make it even more unique
      downloadLink.setAttribute('data-unique-id', Math.random().toString(36).substr(2, 9));
      
      document.body.appendChild(downloadLink);
      
      // Trigger download immediately without timeout
      downloadLink.click();
      
      // Clean up after a short delay
      setTimeout(() => {
        if (document.body.contains(downloadLink)) {
          document.body.removeChild(downloadLink);
        }
        window.URL.revokeObjectURL(url);
      }, 100);
    }
    
    // Increment download count
    downloadCount++;
    localStorage.setItem(downloadCountKey, downloadCount.toString());
    
    console.log('📄 PDF download initiated:', `Download #${downloadCount}`);

    // Update button text
    if (whatsappButton) {
      whatsappButton.innerHTML = '<i class="fab fa-whatsapp"></i> Opening WhatsApp...';
    }

    // Wait a moment for the download to start, then open WhatsApp
    setTimeout(() => {
      // Prepare WhatsApp message
      const message = `🧾 *Invoice ${invoice.invoiceNumber}*

👤 Customer: ${invoice.customer.name}
📅 Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}
💰 Total: ₹${invoice.totalAmount.toLocaleString('en-IN')}
💳 Advance: ₹${invoice.advanceReceived.toLocaleString('en-IN')}
🔄 Balance: ₹${invoice.balancePayable.toLocaleString('en-IN')}
📊 Status: *${invoice.status}*

💼 *Services:*
${invoice.serviceDetails.map((service: any, index: number) => `${index + 1}. ${service.description} - ₹${service.amount.toLocaleString('en-IN')}`).join('\n')}

🏦 *Payment:*
${invoice.selectedBank}

📱 *GLOBAL FINANCIAL SERVICES*
☎️ 9623736781 | 9604722533
📍 Nashik - 422003

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

      // Create payment history entry
      const paymentEntry = {
        amount: paymentAmount,
        date: this.paymentForm.paymentDate,
        type: this.paymentForm.paymentType,
        reference: this.paymentForm.reference || '',
        notes: this.paymentForm.notes || ''
      };

      // Initialize payment history if it doesn't exist
      const currentPaymentHistory = invoice.paymentHistory || [];
      
      // If this is the first payment and there was an initial advance, add it to history
      if (currentPaymentHistory.length === 0 && invoice.advanceReceived > 0) {
        currentPaymentHistory.push({
          amount: invoice.advanceReceived,
          date: invoice.invoiceDate, // Use invoice date as fallback
          type: 'Cash', // Default type for existing advance
          reference: '',
          notes: 'Initial advance payment'
        });
      }

      // Add new payment to history
      currentPaymentHistory.push(paymentEntry);

      await this.invoiceService.updateInvoice(invoice.id!, {
        advanceReceived: newAdvanceReceived,
        balancePayable: newBalancePayable,
        status: newStatus,
        paymentHistory: currentPaymentHistory
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
    // Ensure the cleared list is also sorted
    this.filteredInvoices = this.sortInvoicesByDate(this.filteredInvoices);
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

  // Handle payment type selection - force immediate close
  onPaymentTypeChange(event: any): void {
    const selectElement = event.target;
    const selectedValue = selectElement.value;
    
    // Immediately blur to close dropdown
    setTimeout(() => {
      selectElement.blur();
    }, 10);
    
    // Update payment type
    if (selectedValue) {
      this.paymentForm.paymentType = selectedValue;
    }
  }
}
