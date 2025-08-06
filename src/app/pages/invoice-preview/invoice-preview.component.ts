import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { InvoiceService, Invoice } from '../../services/invoice.service';
import { PdfGenerationNewService } from '../../services/pdf-generation-new.service';

@Component({
  selector: 'app-invoice-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice-preview.component.html',
  styleUrls: ['./invoice-preview.component.css']
})
export class InvoicePreviewComponent implements OnInit {
  invoice: Invoice | null = null;
  isLoading: boolean = true;
  isPreviewMode: boolean = false;
  isCreating: boolean = false;
  invoiceCreated: boolean = false;
  formData: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private invoiceService: InvoiceService,
    private pdfService: PdfGenerationNewService
  ) {}

  ngOnInit() {
    // Check if we're in preview mode or viewing an existing invoice
    this.route.queryParams.subscribe(params => {
      if (params['mode'] === 'preview') {
        this.isPreviewMode = true;
        this.loadPreviewData();
      } else {
        const invoiceId = this.route.snapshot.paramMap.get('id');
        if (invoiceId) {
          this.loadInvoice(invoiceId);
        } else {
          this.router.navigate(['/dashboard']);
        }
      }
    });
  }

  loadPreviewData() {
    try {
      const tempData = sessionStorage.getItem('tempInvoiceData');
      console.log('Loading preview data from sessionStorage:', tempData);
      
      if (tempData) {
        const data = JSON.parse(tempData);
        console.log('Parsed preview data:', data);
        
        this.invoice = data.invoiceData;
        this.formData = data.formData;
        this.isLoading = false;
        
        console.log('Preview loaded - Invoice:', this.invoice);
        console.log('Preview loaded - Form data:', this.formData);
        console.log('🔄 isPreviewMode:', this.isPreviewMode);
        console.log('✅ invoiceCreated:', this.invoiceCreated);
      } else {
        console.warn('No invoice data found for preview');
        alert('No invoice data found for preview!');
        this.router.navigate(['/create-invoice']);
      }
    } catch (error) {
      console.error('Error loading preview data:', error);
      alert('Error loading preview data!');
      this.router.navigate(['/create-invoice']);
    }
  }

  async loadInvoice(invoiceId: string) {
    try {
      const invoices = await this.invoiceService.getInvoices();
      this.invoice = invoices.find(inv => inv.id === invoiceId) || null;
      
      if (!this.invoice) {
        alert('Invoice not found!');
        this.router.navigate(['/dashboard']);
        return;
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
      alert('Error loading invoice!');
      this.router.navigate(['/dashboard']);
    } finally {
      this.isLoading = false;
    }
  }

  printInvoice() {
    if (this.invoice) {
      this.pdfService.generateInvoicePDF(this.invoice);
    }
  }

  shareOnWhatsApp() {
    if (!this.invoice) {
      alert('Invoice data not available. Please try again.');
      return;
    }

    try {
      // Always generate and download PDF for WhatsApp sharing
      console.log('📄 Generating PDF for WhatsApp sharing...');
      
      // Check if this is the first download for this invoice
      const downloadCountKey = `downloadCount_${this.invoice.invoiceNumber}`;
      let downloadCount = parseInt(localStorage.getItem(downloadCountKey) || '0');
      const isFirstDownload = downloadCount === 0;
      
      // Generate PDF with blob method
      const pdfBlob = this.pdfService.generateInvoicePDFBlob(this.invoice);
      
      // Create standard filename
      const customerName = this.invoice.customer?.name || 'Customer';
      const sanitizedCustomerName = customerName.replace(/[^a-zA-Z0-9]/g, '_');
      const baseFilename = `${sanitizedCustomerName}_INV_${this.invoice.invoiceNumber}`;
      
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

      // Prepare comprehensive WhatsApp message
      const message = `🧾 *Invoice ${this.invoice.invoiceNumber}*

👤 Customer: ${this.invoice.customer.name}
📅 Date: ${new Date(this.invoice.invoiceDate).toLocaleDateString('en-IN')}
💰 Total: ₹${this.invoice.totalAmount.toLocaleString('en-IN')}
💳 Advance: ₹${this.invoice.advanceReceived.toLocaleString('en-IN')}
🔄 Balance: ₹${this.invoice.balancePayable.toLocaleString('en-IN')}
📊 Status: *${this.invoice.status}*

💼 *Services:*
${this.invoice.serviceDetails.map((service, index) => {
  const description = this.getServiceDescription(service);
  return `${index + 1}. ${description} - ₹${service.amount.toLocaleString('en-IN')}`;
}).join('\n')}

🏦 *Payment:*
${this.invoice.selectedBank}

📱 *GLOBAL FINANCIAL SERVICES*
☎️ 9623736781 | 9604722533
📍 Nashik - 422003

Thank you for your business! 🙏`;

      // Clean phone number (remove all non-digits)
      const phoneNumber = this.invoice.customer.mobile.replace(/\D/g, '');
      
      // Log for debugging
      console.log('📱 Phone number:', phoneNumber);
      console.log('💬 Message length:', message.length);
      console.log('📝 Message preview:', message.substring(0, 100) + '...');
      
      // Create WhatsApp URL
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
      
      console.log('🔗 Opening WhatsApp without PDF download');
      
      // Open WhatsApp immediately (no delay needed since download is programmatic)
      window.open(whatsappUrl, '_blank');
      
    } catch (error) {
      console.error('❌ Error sharing on WhatsApp:', error);
      alert('Error sharing invoice. Please try again.');
    }
  }

  async createInvoice() {
    console.log('🚀 createInvoice() called');
    console.log('📊 Current state - isPreviewMode:', this.isPreviewMode);
    console.log('📊 Current state - invoice:', this.invoice);
    console.log('📊 Current state - isCreating:', this.isCreating);
    
    if (!this.isPreviewMode || !this.invoice || this.isCreating) {
      console.warn('⚠️ createInvoice conditions not met');
      return;
    }

    this.isCreating = true;
    console.log('💾 Starting invoice creation process...');

    try {
      let invoiceId: string;
      
      // Check if this is an edit operation
      if (this.formData && this.formData.isEditMode && this.formData.editInvoiceId) {
        // Update existing invoice
        await this.invoiceService.updateInvoice(this.formData.editInvoiceId, this.invoice);
        invoiceId = this.formData.editInvoiceId;
        this.invoice.id = invoiceId;
      } else {
        // Generate proper invoice number for new invoices
        this.invoice.invoiceNumber = await this.invoiceService.generateNextInvoiceNumber(this.invoice.invoiceDate);
        
        // Create new invoice
        invoiceId = await this.invoiceService.addInvoice(this.invoice);
        this.invoice.id = invoiceId;
      }
      
      // Clear temporary data
      sessionStorage.removeItem('tempInvoiceData');
      
      // Mark as created/updated
      this.invoiceCreated = true;
      this.isPreviewMode = false;
      
      // Update the URL to reflect the saved invoice
      this.router.navigate(['/invoice-preview', invoiceId], { replaceUrl: true });
      
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Error saving invoice. Please try again.');
    } finally {
      this.isCreating = false;
    }
  }

  editInvoice() {
    if (this.isPreviewMode) {
      // If in preview mode, restore the form data and go back to create invoice
      // Store the current invoice data as form data for editing
      const editData = {
        isEditMode: true,
        editInvoiceId: this.formData?.editInvoiceId || null,
        invoiceData: this.invoice,
        formData: this.formData
      };
      
      // Store in sessionStorage so create-invoice can restore the form
      sessionStorage.setItem('editInvoiceData', JSON.stringify(editData));
      
      this.router.navigate(['/create-invoice'], { queryParams: { mode: 'edit' } });
    } else if (this.invoice) {
      // For saved invoices, navigate with edit parameter
      this.router.navigate(['/create-invoice'], { queryParams: { edit: this.invoice.id } });
    }
  }

  goBack() {
    if (this.isPreviewMode) {
      // Store the current invoice data for form restoration
      const restoreData = {
        invoiceData: this.invoice,
        formData: this.formData,
        isEditMode: this.formData?.isEditMode || false,
        editInvoiceId: this.formData?.editInvoiceId || null
      };
      
      // Store data for form restoration
      sessionStorage.setItem('editInvoiceData', JSON.stringify(restoreData));
      
      // Navigate back to create invoice with edit mode
      this.router.navigate(['/create-invoice'], { queryParams: { mode: 'edit' } });
    } else {
      this.router.navigate(['/dashboard'], { queryParams: { category: 'invoices' } });
    }
  }

  cancelInvoice() {
    if (this.isPreviewMode) {
      if (confirm('Are you sure you want to cancel this invoice? Any unsaved changes will be lost.')) {
        // Clear temporary data and navigate back to dashboard
        sessionStorage.removeItem('tempInvoiceData');
        sessionStorage.removeItem('editInvoiceData');
        this.router.navigate(['/dashboard'], { queryParams: { category: 'invoices' } });
      }
    } else {
      // For saved invoices, just go back to dashboard
      this.router.navigate(['/dashboard'], { queryParams: { category: 'invoices' } });
    }
  }

  getServiceDescription(service: any): string {
    if (service.description === 'custom' && service.customDescription) {
      return service.customDescription;
    }
    return service.description;
  }
}
