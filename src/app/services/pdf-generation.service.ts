import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

@Injectable({
  providedIn: 'root'
})
export class PdfGenerationService {

  constructor() { }

  generateInvoicePDF(invoice: any): void {
    const doc = new jsPDF();
    
    // Calculate if we need multiple pages
    const maxServicesPerPage = 8;
    const needsSecondPage = invoice.serviceDetails.length > maxServicesPerPage;
    
    // Generate first page
    this.generateFirstPage(doc, invoice, needsSecondPage);
    
    // Generate second page if needed
    if (needsSecondPage) {
      this.generateSecondPage(doc, invoice, maxServicesPerPage);
    }
    
        // Use customer name and invoice number for filename
        const safeName = (invoice.customer?.name || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
        doc.save(`${safeName}_${invoice.invoiceNumber}.pdf`);
  }

  private generateFirstPage(doc: jsPDF, invoice: any, needsSecondPage: boolean): void {
    this.addPageBorder(doc);
    this.addCompanyHeader(doc);
    this.addCustomerDetails(doc, invoice);
    
    const servicesEndY = this.addServicesTable(doc, invoice, needsSecondPage, 0);
    
    if (!needsSecondPage) {
      // Add all the closing sections on first page
      const totalY = this.addTotalSection(doc, invoice, servicesEndY);
      const paymentY = this.addPaymentSection(doc, invoice, totalY);
      this.addBankDetailsSection(doc, invoice, paymentY);
    } else {
      // Add continuation notice
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('Continued on next page...', 105, 260, { align: 'center' });
    }
  }

  private generateSecondPage(doc: jsPDF, invoice: any, startIndex: number): void {
    doc.addPage();
    
    // Simple header for second page
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(52, 152, 219);
    doc.text('GLOBAL FINANCIAL SERVICES', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text('INVOICE (Continued)', 105, 30, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice No: ${invoice.invoiceNumber}`, 105, 40, { align: 'center' });
    
    // Continue services table
    const servicesEndY = this.addServicesTable(doc, invoice, false, startIndex, 50);
    
    // Add closing sections
    const totalY = this.addTotalSection(doc, invoice, servicesEndY);
    const paymentY = this.addPaymentSection(doc, invoice, totalY);
    this.addBankDetailsSection(doc, invoice, paymentY);
  }

  private addPageBorder(doc: jsPDF): void {
    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);
    doc.rect(10, 10, 190, 277);
  }

  private addCompanyHeader(doc: jsPDF): void {
    doc.setFont('helvetica');
    
    // Company name
    doc.setFontSize(20);
    doc.setTextColor(52, 152, 219);
    doc.text('GLOBAL FINANCIAL SERVICES', 105, 25, { align: 'center' });
    
    // Subtitle
    doc.setFontSize(14);
    doc.setTextColor(40, 167, 69);
    doc.text('ACCOUNTING & FINANCIAL SERVICES', 105, 35, { align: 'center' });
    
    // Address
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Flat No. 602, Ashirvad Symphani, Meera Datar Road, Near K K Wagh College,', 105, 45, { align: 'center' });
    doc.text('Panchavati, Nashik - 422003.', 105, 52, { align: 'center' });
    
    // Contact
    doc.setFontSize(9);
    doc.text('Cell : 9623736781    |    Cell : 9604722533', 105, 60, { align: 'center' });
    
    // Invoice title
    doc.setFillColor(0, 0, 0);
    doc.rect(15, 70, 180, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 105, 78, { align: 'center' });
  }

  private addCustomerDetails(doc: jsPDF, invoice: any): void {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    
    // Boxes
    doc.setLineWidth(0.3);
    doc.setDrawColor(150, 150, 150);
    doc.rect(15, 85, 120, 30); // TO box
    doc.rect(135, 85, 60, 30); // Invoice details box
    
    // TO section
    doc.setFont('helvetica', 'bold');
    doc.text('TO,', 18, 93);
    doc.setFont('helvetica', 'normal');
    
    if (invoice.customer) {
      const customerLines = this.formatCustomerAddress(invoice.customer);
      let yPosition = 100;
      customerLines.forEach((line: string) => {
        const maxWidth = 114;
        const wrappedLines = doc.splitTextToSize(line, maxWidth);
        wrappedLines.forEach((wrappedLine: string) => {
          if (yPosition < 112) {
            doc.text(wrappedLine, 18, yPosition);
            yPosition += 4;
          }
        });
      });
    }
    
    // Invoice details
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice No.', 138, 93);
    doc.text('Date', 138, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(': ' + invoice.invoiceNumber, 163, 93);
    doc.text(': ' + this.formatDate(invoice.invoiceDate), 163, 100);
  }

  private addServicesTable(doc: jsPDF, invoice: any, isFirstPage: boolean, startIndex: number = 0, startY: number = 120): number {
    let currentY = startY;
    
    // Table header
    doc.setLineWidth(0.3);
    doc.setDrawColor(150, 150, 150);
    doc.rect(15, currentY, 180, 10);
    doc.setFillColor(248, 249, 250);
    doc.rect(15, currentY, 180, 10, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    if (startY === 120) {
      doc.text('Fees for Professional services rendered as under :', 18, currentY + 7);
    } else {
      doc.text('Services (Continued) :', 18, currentY + 7);
    }
    
    currentY += 10;
    
    // Column headers
    doc.setLineWidth(0.3);
    doc.setDrawColor(150, 150, 150);
    doc.rect(15, currentY, 180, 8);
    doc.rect(15, currentY, 20, 8);   // No.
    doc.rect(35, currentY, 110, 8);  // Particulars
    doc.rect(145, currentY, 50, 8);  // Amount
    
    doc.setFont('helvetica', 'bold');
    doc.text('No.', 23, currentY + 5);
    doc.text('Particulars', 85, currentY + 5);
    doc.text('Amount', 165, currentY + 5);
    
    currentY += 8;
    doc.setFont('helvetica', 'normal');
    
    // Determine which services to show
    let servicesToShow;
    if (isFirstPage) {
      // First page: show up to 8 services
      servicesToShow = invoice.serviceDetails.slice(0, Math.min(8, invoice.serviceDetails.length));
    } else {
      // Second page: show remaining services
      servicesToShow = invoice.serviceDetails.slice(startIndex);
    }
    
    // Add service rows
    servicesToShow.forEach((service: any, index: number) => {
      const actualServiceIndex = isFirstPage ? index : startIndex + index;
      const rowHeight = 12;
      
      // Row borders
      doc.setLineWidth(0.2);
      doc.setDrawColor(180, 180, 180);
      doc.rect(15, currentY, 180, rowHeight);
      doc.rect(15, currentY, 20, rowHeight);
      doc.rect(35, currentY, 110, rowHeight);
      doc.rect(145, currentY, 50, rowHeight);
      
      // Service number
      doc.text((actualServiceIndex + 1).toString(), 25, currentY + 8);
      
      // Service description
      let description = service.description;
      if (service.description === 'custom' && (service as any).customDescription) {
        description = (service as any).customDescription;
      }
      description = description + (service.notes ? ` (${service.notes})` : '');
      
      const maxWidth = 105;
      const descriptionLines = doc.splitTextToSize(description, maxWidth);
      
      if (descriptionLines.length === 1) {
        doc.text(descriptionLines[0], 38, currentY + 8);
      } else {
        doc.text(descriptionLines[0], 38, currentY + 5);
        if (descriptionLines[1] && descriptionLines[1].trim()) {
          doc.text(descriptionLines[1], 38, currentY + 10);
        }
      }
      
      // Amount
      const formattedAmount = this.formatAmount(service.amount);
      const amountWidth = doc.getTextWidth(formattedAmount);
      doc.text(formattedAmount, 190 - amountWidth, currentY + 8);
      
      currentY += rowHeight;
    });
    
    // Add empty rows only on the final page to maintain consistent layout
    if (!isFirstPage || invoice.serviceDetails.length <= 8) {
      const minRows = 6;
      const usedRows = servicesToShow.length;
      for (let i = usedRows; i < minRows; i++) {
        const rowHeight = 12;
        doc.setLineWidth(0.2);
        doc.setDrawColor(180, 180, 180);
        doc.rect(15, currentY, 180, rowHeight);
        doc.rect(15, currentY, 20, rowHeight);
        doc.rect(35, currentY, 110, rowHeight);
        doc.rect(145, currentY, 50, rowHeight);
        currentY += rowHeight;
      }
    }
    
    return currentY;
  }

  private addTotalSection(doc: jsPDF, invoice: any, startY: number): number {
    const currentY = startY;
    const rowHeight = 12;
    
    // Total row
    doc.setLineWidth(0.3);
    doc.setDrawColor(150, 150, 150);
    doc.rect(15, currentY, 180, rowHeight);
    doc.rect(15, currentY, 125, rowHeight);
    doc.rect(140, currentY, 55, rowHeight);
    
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL', 142, currentY + 8);
    
    const formattedTotal = this.formatAmount(invoice.totalAmount);
    const totalWidth = doc.getTextWidth(formattedTotal);
    doc.text(formattedTotal, 190 - totalWidth, currentY + 8);
    
    return currentY + rowHeight;
  }

  private addPaymentSection(doc: jsPDF, invoice: any, startY: number): number {
    const currentY = startY;
    const sectionHeight = 18;
    
    // Main boxes
    doc.setLineWidth(0.3);
    doc.setDrawColor(150, 150, 150);
    doc.rect(15, currentY, 120, sectionHeight);  // Amount in words
    doc.rect(135, currentY, 60, sectionHeight);  // Payment details
    
    // Payment detail sub-boxes
    doc.rect(135, currentY, 30, 6);      // Advance label
    doc.rect(165, currentY, 30, 6);      // Advance amount
    doc.rect(135, currentY + 6, 30, 6);  // Bill label
    doc.rect(165, currentY + 6, 30, 6);  // Bill amount
    doc.rect(135, currentY + 12, 30, 6); // Balance label
    doc.rect(165, currentY + 12, 30, 6); // Balance amount
    
    // Amount in words
    doc.setFont('helvetica', 'normal');
    const amountInWords = this.convertAmountToWords(invoice.totalAmount);
    const amountText = 'Amount in words : ' + amountInWords;
    const maxWidth = 115;
    const amountLines = doc.splitTextToSize(amountText, maxWidth);
    let wordY = currentY + 6;
    amountLines.forEach((line: string) => {
      if (wordY < currentY + 16) {
        doc.text(line, 18, wordY);
        wordY += 3.5;
      }
    });
    
    // Payment details
    doc.setFont('helvetica', 'bold');
    doc.text('Advance Rec.', 137, currentY + 4);
    doc.text('Bill Amt.', 137, currentY + 10);
    doc.text('Net Bal.', 137, currentY + 16);
    
    doc.setFont('helvetica', 'normal');
    const rightEdge = 190;
    
    const formattedAdvance = this.formatAmount(invoice.advanceReceived);
    const formattedBill = this.formatAmount(invoice.totalAmount);
    const formattedBalance = this.formatAmount(invoice.balancePayable);
    
    doc.text(formattedAdvance, rightEdge - doc.getTextWidth(formattedAdvance), currentY + 4);
    doc.text(formattedBill, rightEdge - doc.getTextWidth(formattedBill), currentY + 10);
    
    doc.setFont('helvetica', 'bold');
    doc.text(formattedBalance, rightEdge - doc.getTextWidth(formattedBalance), currentY + 16);
    
    return currentY + sectionHeight;
  }

  private addBankDetailsSection(doc: jsPDF, invoice: any, startY: number): number {
    let currentY = startY + 5;
    const sectionHeight = 30;
    
    // Ensure we don't go off page
    if (currentY + sectionHeight > 280) {
      currentY = 240;
    }
    
    // Boxes
    doc.setLineWidth(0.3);
    doc.setDrawColor(150, 150, 150);
    doc.rect(15, currentY, 120, sectionHeight);  // Bank details
    doc.rect(135, currentY, 60, sectionHeight);  // Signature
    
    // Bank details
    doc.setFont('helvetica', 'bold');
    doc.text('Bank Details :', 18, currentY + 7);
    doc.setFont('helvetica', 'normal');
    
    const bankDetails = this.extractBankDetails(invoice.selectedBank);
    doc.text('Bank Name : ' + bankDetails.name, 18, currentY + 12);
    doc.text('A/c Holder Name : Global Financial Services', 18, currentY + 17);
    doc.text('A/c No. : ' + bankDetails.accountNumber, 18, currentY + 22);
    doc.text('IFSC Code : ' + bankDetails.ifscCode, 18, currentY + 27);
    
    // Signature section - positioned to avoid overlap with amount boxes
    doc.setTextColor(52, 152, 219);
    doc.setFont('helvetica', 'bold');
    doc.text('for GLOBAL FINANCIAL', 140, currentY + 8);
    doc.text('SERVICES', 155, currentY + 14);
    
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text('Authorised Signatory', 145, currentY + 27);
    
    // Footer
    const footerY = currentY + sectionHeight + 5;
    if (footerY < 285) {
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Thank you for your business!', 105, footerY, { align: 'center' });
    }
    
    return footerY;
  }

  // Helper methods
  private formatCustomerAddress(customer: any): string[] {
    const lines = [];
    lines.push(customer.name);
    if (customer.mobile) lines.push('Mobile: ' + customer.mobile);
    if (customer.email) lines.push('Email: ' + customer.email);
    if (customer.address) lines.push('Address: ' + customer.address);
    if (customer.gst) lines.push('GST: ' + customer.gst);
    return lines;
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN');
  }

  private formatAmount(amount: number): string {
    return  amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private convertAmountToWords(amount: number): string {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (amount === 0) return 'Zero Rupees Only';
    
    const integerPart = Math.floor(amount);
    const decimalPart = Math.round((amount - integerPart) * 100);
    
    let result = this.convertIntegerToWords(integerPart, ones, teens, tens);
    result += ' Rupees';
    
    if (decimalPart > 0) {
      result += ' and ' + this.convertIntegerToWords(decimalPart, ones, teens, tens) + ' Paise';
    }
    
    result += ' Only';
    return result;
  }

  private convertIntegerToWords(num: number, ones: string[], teens: string[], tens: string[]): string {
    if (num === 0) return '';
    
    let result = '';
    
    // Crores
    if (num >= 10000000) {
      result += this.convertIntegerToWords(Math.floor(num / 10000000), ones, teens, tens) + ' Crore ';
      num %= 10000000;
    }
    
    // Lakhs
    if (num >= 100000) {
      result += this.convertIntegerToWords(Math.floor(num / 100000), ones, teens, tens) + ' Lakh ';
      num %= 100000;
    }
    
    // Thousands
    if (num >= 1000) {
      result += this.convertIntegerToWords(Math.floor(num / 1000), ones, teens, tens) + ' Thousand ';
      num %= 1000;
    }
    
    // Hundreds
    if (num >= 100) {
      result += ones[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }
    
    // Tens and ones
    if (num >= 20) {
      result += tens[Math.floor(num / 10)] + ' ';
      num %= 10;
    } else if (num >= 10) {
      result += teens[num - 10] + ' ';
      num = 0;
    }
    
    if (num > 0) {
      result += ones[num] + ' ';
    }
    
    return result.trim();
  }

  private extractBankDetails(selectedBank: string): any {
    const bankDetails: { [key: string]: any } = {
      'HDFC Bank': {
        name: 'HDFC Bank',
        accountNumber: '12345678901234',
        ifscCode: 'HDFC0001234'
      },
      'SBI Bank': {
        name: 'State Bank of India',
        accountNumber: '98765432109876',
        ifscCode: 'SBIN0001234'
      },
      'ICICI Bank': {
        name: 'ICICI Bank',
        accountNumber: '11223344556677',
        ifscCode: 'ICIC0001234'
      },
      'PNB Bank': {
        name: 'Punjab National Bank',
        accountNumber: '55667788990011',
        ifscCode: 'PUNB0001234'
      }
    };
    
    return bankDetails[selectedBank] || bankDetails['HDFC Bank'];
  }

    // ...existing code...
  
  // Updated shareOnWhatsApp method to use Web Share API if available
  shareOnWhatsApp(invoice: any): void {
    // Try Web Share API if available (iOS/Android PWA)
    const safeName = (invoice.customer?.name || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${safeName}_${invoice.invoiceNumber}.pdf`;
    const message = `Invoice Details:\nInvoice No: ${invoice.invoiceNumber}\nCustomer: ${invoice.customer.name}\nAmount: ₹${invoice.totalAmount.toLocaleString('en-IN')}\nBalance: ₹${invoice.balancePayable.toLocaleString('en-IN')}`;
    // Generate PDF blob
    const doc = new jsPDF();
    this.generateInvoicePDF(invoice);
    const pdfBlob = doc.output('blob');
    // Web Share API
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], fileName, { type: 'application/pdf' })] })) {
      navigator.share({
        title: 'Invoice',
        text: message,
        files: [new File([pdfBlob], fileName, { type: 'application/pdf' })]
      }).catch(() => {
        alert('Sharing cancelled or not supported.');
      });
    } else {
      // Fallback: WhatsApp web link (Android/desktop)
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
      // Show info for iOS users
      if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
        alert('On iPhone, you must use the share sheet to send the PDF via WhatsApp. Direct sharing is not supported by iOS PWAs.');
      }
    }
  }
}
