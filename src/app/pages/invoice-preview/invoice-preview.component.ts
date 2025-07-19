import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { InvoiceService, Invoice } from '../../services/invoice.service';
import { PdfGenerationService } from '../../services/pdf-generation.service';

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
    private pdfService: PdfGenerationService
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
    if (!this.invoice) return;

    try {
      // Generate PDF first
      this.pdfService.generateInvoicePDF(this.invoice);

      // Wait a moment for the download to start
      setTimeout(() => {
        // Prepare WhatsApp message
        const message = `🧾 *Invoice ${this.invoice!.invoiceNumber}*

👤 Customer: ${this.invoice!.customer.name}
📅 Date: ${new Date(this.invoice!.invoiceDate).toLocaleDateString('en-IN')}
💰 Total: ₹${this.invoice!.totalAmount.toLocaleString('en-IN')}
💳 Advance: ₹${this.invoice!.advanceReceived.toLocaleString('en-IN')}
🔄 Balance: ₹${this.invoice!.balancePayable.toLocaleString('en-IN')}
📊 Status: *${this.invoice!.status}*

💼 *Services:*
${this.invoice!.serviceDetails.map((service, index) => `${index + 1}. ${service.description} - ₹${service.amount.toLocaleString('en-IN')}`).join('\n')}

🏦 *Payment:*
${this.invoice!.selectedBank}

📱 *GLOBAL FINANCIAL SERVICES*
☎️ 9623736781 | 9604722533
📍 Nashik - 422003

📄 PDF invoice downloaded to your device. Please attach it manually in WhatsApp by clicking the attachment (📎) button.

Thank you for your business! 🙏`;

        // Open WhatsApp
        const phoneNumber = this.invoice!.customer.mobile.replace(/\D/g, '');
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      }, 1500);
    } catch (error) {
      console.error('Error sharing on WhatsApp:', error);
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
