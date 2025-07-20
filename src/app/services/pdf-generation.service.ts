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
    
    // Page border - lighter
    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200); // Light gray border
    doc.rect(10, 10, 190, 277); // Full page border
    
    // Set font
    doc.setFont('helvetica');
    
    // Company Header
    doc.setFontSize(20);
    doc.setTextColor(52, 152, 219); // Blue color
    doc.text('GLOBAL FINANCIAL SERVICES', 105, 25, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(40, 167, 69); // Green color
    doc.text('ACCOUNTING & FINANCIAL SERVICES', 105, 35, { align: 'center' });
    
    // Company Address
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Flat No. 602, Ashirvad Symphani, Meera Datar Road, Near K K Wagh College,', 105, 45, { align: 'center' });
    doc.text('Panchavati, Nashik - 422003.', 105, 52, { align: 'center' });
    
    // Contact Details
    doc.setFontSize(9);
    doc.text('Cell : 9623736781    |    Cell : 9604722533', 105, 60, { align: 'center' });
    
    // Invoice Title
    doc.setFillColor(0, 0, 0);
    doc.rect(15, 70, 180, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 105, 78, { align: 'center' });
    
    // Reset font
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    
    // TO section and Invoice details boxes - lighter borders
    doc.setLineWidth(0.3);
    doc.setDrawColor(150, 150, 150); // Light gray
    doc.rect(15, 85, 120, 30); // TO box
    doc.rect(135, 85, 60, 30); // Invoice details box
    
    // TO section
    doc.setFont('helvetica', 'bold');
    doc.text('TO,', 18, 93);
    doc.setFont('helvetica', 'normal');
    
    // Customer details with proper text wrapping
    if (invoice.customer) {
      const customerLines = this.formatCustomerAddress(invoice.customer);
      let yPosition = 100;
      customerLines.forEach((line: string) => {
        // Ensure text fits within the TO box (120 width - 6 padding = 114 max width)
        const maxWidth = 114;
        const wrappedLines = doc.splitTextToSize(line, maxWidth);
        wrappedLines.forEach((wrappedLine: string) => {
          if (yPosition < 112) { // Stay within TO box height
            doc.text(wrappedLine, 18, yPosition);
            yPosition += 4;
          }
        });
      });
    }
    
    // Invoice number and date
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice No.', 138, 93);
    doc.text('Date', 138, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(': ' + invoice.invoiceNumber, 163, 93);
    doc.text(': ' + this.formatDate(invoice.invoiceDate), 163, 100);
    
    // Services Table Header - lighter borders
    const tableStartY = 120;
    doc.setLineWidth(0.3);
    doc.setDrawColor(150, 150, 150);
    doc.rect(15, tableStartY, 180, 10);
    doc.setFillColor(248, 249, 250); // Very light gray background
    doc.rect(15, tableStartY, 180, 10, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Fees for Professional services rendered as under :', 18, tableStartY + 7);
    
    // Table headers with proper column alignment - lighter borders (adjusted column widths)
    const headerY = tableStartY + 15;
    doc.setLineWidth(0.3);
    doc.setDrawColor(150, 150, 150);
    doc.rect(15, headerY, 180, 8); // Header row
    doc.rect(15, headerY, 20, 8); // No. column
    doc.rect(35, headerY, 110, 8); // Particulars column (reduced from 120)
    doc.rect(145, headerY, 50, 8); // Amount column (increased from 40)
    
    doc.setFont('helvetica', 'bold');
    doc.text('No.', 23, headerY + 5); // Centered in No. column
    doc.text('Particulars', 85, headerY + 5); // Centered in Particulars column
    doc.text('Amount', 165, headerY + 5); // Centered in Amount column
    
    // Service details with proper alignment and text wrapping
    doc.setFont('helvetica', 'normal');
    let currentY = headerY + 8;
    
    invoice.serviceDetails.forEach((service: any, index: number) => {
      const rowHeight = 12;
      
      // Draw row border - lighter (adjusted column widths)
      doc.setLineWidth(0.2);
      doc.setDrawColor(180, 180, 180);
      doc.rect(15, currentY, 180, rowHeight);
      doc.rect(15, currentY, 20, rowHeight); // No. column border
      doc.rect(35, currentY, 110, rowHeight); // Particulars column border (reduced from 120)
      doc.rect(145, currentY, 50, rowHeight); // Amount column border (increased from 40)
      
      // No. column - centered
      doc.text((index + 1).toString(), 25, currentY + 8);
      
      // Particulars column - left aligned with proper text wrapping (adjusted width)
      let description = service.description;
      
      // Handle custom services properly
      if (service.description === 'custom' && (service as any).customDescription) {
        description = (service as any).customDescription;
      }
      
      description = description + (service.notes ? ` (${service.notes})` : '');
      const maxWidth = 100; // Reduced width to fix amount column boundary
      const descriptionLines = doc.splitTextToSize(description, maxWidth);
      
      if (descriptionLines.length === 1) {
        doc.text(descriptionLines[0], 38, currentY + 8);
      } else {
        // Handle multi-line descriptions - ensure they fit
        doc.text(descriptionLines[0], 38, currentY + 5);
        if (descriptionLines[1] && descriptionLines[1].trim()) {
          doc.text(descriptionLines[1], 38, currentY + 10);
        }
      }
      
      // Amount column - right aligned with proper padding (well within boundary)
      const formattedAmount = this.formatAmount(service.amount);
      const amountText = `₹${formattedAmount}`;
      const amountWidth = doc.getTextWidth(amountText);
      const rightEdge = 185; // Column ends at 195, more padding for safety
      doc.text(amountText, rightEdge - amountWidth, currentY + 8);
      
      currentY += rowHeight;
    });
    
    // Add empty rows to fill space - lighter borders (reduced count for better space management, adjusted column widths)
    const minRows = 6; // Reduced from 8 to 6 to save space
    const currentRows = invoice.serviceDetails.length;
    for (let i = currentRows; i < minRows; i++) {
      const rowHeight = 12;
      doc.setLineWidth(0.2);
      doc.setDrawColor(180, 180, 180);
      doc.rect(15, currentY, 180, rowHeight);
      doc.rect(15, currentY, 20, rowHeight); // No. column
      doc.rect(35, currentY, 110, rowHeight); // Particulars column (adjusted)
      doc.rect(145, currentY, 50, rowHeight); // Amount column (adjusted)
      currentY += rowHeight;
    }
    
    // Total section - lighter borders (adjusted column widths)
    const totalRowHeight = 12;
    doc.setLineWidth(0.3);
    doc.setDrawColor(150, 150, 150);
    doc.rect(15, currentY, 180, totalRowHeight);
    doc.rect(15, currentY, 125, totalRowHeight); // Empty space (adjusted)
    doc.rect(140, currentY, 55, totalRowHeight); // TOTAL label and amount (adjusted)
    
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL', 142, currentY + 8);
    const formattedTotal = this.formatAmount(invoice.totalAmount);
    const totalText = `₹${formattedTotal}`;
    const totalWidth = doc.getTextWidth(totalText);
    const rightEdge = 185; // Matching the amount column alignment
    doc.text(totalText, rightEdge - totalWidth, currentY + 8);
    
    currentY += totalRowHeight;
    
    // Amount in words and payment details section - lighter borders (reduced height)
    const paymentSectionHeight = 18; // Reduced from 20 to 18
    doc.setLineWidth(0.3);
    doc.setDrawColor(150, 150, 150);
    doc.rect(15, currentY, 120, paymentSectionHeight); // Amount in words
    doc.rect(135, currentY, 60, paymentSectionHeight); // Payment details
    
    // Split payment details into rows
    doc.rect(135, currentY, 30, 6); // Advance Rec. label
    doc.rect(165, currentY, 30, 6); // Advance amount
    doc.rect(135, currentY + 6, 30, 6); // Bill Amt. label (reduced height)
    doc.rect(165, currentY + 6, 30, 6); // Bill amount
    doc.rect(135, currentY + 12, 30, 6); // Net Bal. label (reduced height)
    doc.rect(165, currentY + 12, 30, 6); // Net balance
    
    // Amount in words with text wrapping (more compact)
    doc.setFont('helvetica', 'normal');
    const amountInWords = this.convertAmountToWords(invoice.totalAmount);
    const amountText = 'Amount in words : ' + amountInWords;
    const maxAmountWidth = 115; // Max width for amount in words section
    const amountLines = doc.splitTextToSize(amountText, maxAmountWidth);
    let amountY = currentY + 6;
    amountLines.forEach((line: string) => {
      if (amountY < currentY + 16) { // Stay within section bounds
        doc.text(line, 18, amountY);
        amountY += 3.5; // Reduced line spacing
      }
    });
    
    // Payment details - properly aligned with padding and fixed positioning
    doc.setFont('helvetica', 'bold');
    doc.text('Advance Rec.', 137, currentY + 4);
    doc.text('Bill Amt.', 137, currentY + 10);
    doc.text('Net Bal.', 137, currentY + 16);
    
    doc.setFont('helvetica', 'normal');
    const rightEdgePayment = 185; // Matching amount column alignment with proper padding
    const formattedAdvance = this.formatAmount(invoice.advanceReceived);
    const formattedBillAmt = this.formatAmount(invoice.totalAmount);
    const formattedNetBal = this.formatAmount(invoice.balancePayable);
    let advanceText = `₹${formattedAdvance}`;
    let billAmtText = `₹${formattedBillAmt}`;
    let netBalText = `₹${formattedNetBal}`;
    
    doc.text(advanceText, rightEdgePayment - doc.getTextWidth(advanceText), currentY + 4);
    doc.text(billAmtText, rightEdgePayment - doc.getTextWidth(billAmtText), currentY + 10);
    
    // Make Net Balance bold
    doc.setFont('helvetica', 'bold');
    doc.text(netBalText, rightEdgePayment - doc.getTextWidth(netBalText), currentY + 16);
    
    currentY += paymentSectionHeight + 5;
    
    // Check if there's enough space for bank details, if not adjust layout
    const remainingSpace = 287 - currentY; // 287 is page height minus bottom margin
    const requiredSpace = 45; // Bank section + footer
    
    if (remainingSpace < requiredSpace) {
      currentY = 240; // Move bank details higher to fit within page
    }
    
    // Bank Details section - lighter borders and proper positioning
    const bankSectionHeight = 30; // Reduced height to fit better
    doc.setLineWidth(0.3);
    doc.setDrawColor(150, 150, 150);
    doc.rect(15, currentY, 120, bankSectionHeight); // Bank details
    doc.rect(135, currentY, 60, bankSectionHeight); // Company signature
    
    doc.setFont('helvetica', 'bold');
    doc.text('Bank Details :', 18, currentY + 7);
    doc.setFont('helvetica', 'normal');
    
    // Extract bank details from selected bank with proper spacing
    const bankDetails = this.extractBankDetails(invoice.selectedBank);
    doc.text('Bank Name : ' + bankDetails.name, 18, currentY + 12);
    doc.text('A/c Holder Name : Global Financial Services', 18, currentY + 17);
    doc.text('A/c No. : ' + bankDetails.accountNumber, 18, currentY + 22);
    doc.text('IFSC Code : ' + bankDetails.ifscCode, 18, currentY + 27);
    
    // Company name and signature on right - properly positioned
    doc.setTextColor(52, 152, 219);
    doc.setFont('helvetica', 'bold');
    doc.text('for GLOBAL FINANCIAL', 140, currentY + 8);
    doc.text('SERVICES', 155, currentY + 14);
    
    // Signature placeholder
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text('Authorised Signatory', 145, currentY + 27);
    
    currentY += bankSectionHeight + 5;
    
    // Footer - ensure it stays within page bounds
    if (currentY < 280) {
      doc.setFontSize(8);
      doc.text('* Subject to Nashik Jurisdiction', 18, currentY);
    }
    
    // Save the PDF with customer name and invoice number format
    const customerName = invoice.customer?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Customer';
    const fileName = `${customerName}_Inv_${invoice.invoiceNumber}.pdf`;
    doc.save(fileName);
  }

  // New method for generating PDF as blob for sharing
  generateInvoicePDFBlob(invoice: any): Promise<Blob> {
    return new Promise((resolve) => {
      const doc = new jsPDF();
      
      // Page border - lighter
      doc.setLineWidth(0.5);
      doc.setDrawColor(200, 200, 200); // Light gray border
      doc.rect(10, 10, 190, 277); // Full page border
      
      // Set font
      doc.setFont('helvetica');
      
      // Company Header
      doc.setFontSize(20);
      doc.setTextColor(52, 152, 219); // Blue color
      doc.text('GLOBAL FINANCIAL SERVICES', 105, 25, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setTextColor(40, 167, 69); // Green color
      doc.text('ACCOUNTING & FINANCIAL SERVICES', 105, 35, { align: 'center' });
      
      // Company Address
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text('Flat No. 602, Ashirvad Symphani, Meera Datar Road, Near K K Wagh College,', 105, 45, { align: 'center' });
      doc.text('Panchavati, Nashik - 422003.', 105, 52, { align: 'center' });
      
      // Contact Details
      doc.setFontSize(9);
      doc.text('Cell : 9623736781    |    Cell : 9604722533', 105, 60, { align: 'center' });
      
      // Invoice Title
      doc.setFillColor(0, 0, 0);
      doc.rect(15, 70, 180, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('INVOICE', 105, 78, { align: 'center' });
      
      // Reset font
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      
      // TO section and Invoice details boxes
      doc.rect(15, 85, 120, 30); // TO box
      doc.rect(135, 85, 60, 30); // Invoice details box
      
      // TO section
      doc.setFont('helvetica', 'bold');
      doc.text('TO,', 18, 93);
      doc.setFont('helvetica', 'normal');
      
      // Customer details
      if (invoice.customer) {
        const customerLines = this.formatCustomerAddress(invoice.customer);
        let yPosition = 100;
        customerLines.forEach((line: string) => {
          const truncatedLine = line.length > 35 ? line.substring(0, 35) + '...' : line;
          doc.text(truncatedLine, 18, yPosition);
          yPosition += 5;
        });
      }
      
      // Invoice number and date
      doc.setFont('helvetica', 'bold');
      doc.text('Invoice No.', 138, 93);
      doc.text('Date', 138, 100);
      doc.setFont('helvetica', 'normal');
      doc.text(': ' + invoice.invoiceNumber, 163, 93);
      doc.text(': ' + this.formatDate(invoice.invoiceDate), 163, 100);
      
      // Services Table Header
      const tableStartY = 120;
      doc.rect(15, tableStartY, 180, 10);
      doc.setFillColor(240, 240, 240);
      doc.rect(15, tableStartY, 180, 10, 'F');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Fees for Professional services rendered as under :', 18, tableStartY + 7);
      
      // Table headers with proper column alignment
      const headerY = tableStartY + 15;
      doc.rect(15, headerY, 180, 8); // Header row
      doc.rect(15, headerY, 20, 8); // No. column
      doc.rect(35, headerY, 120, 8); // Particulars column
      doc.rect(155, headerY, 40, 8); // Amount column
      
      doc.setFont('helvetica', 'bold');
      doc.text('No.', 23, headerY + 5); // Centered in No. column
      doc.text('Particulars', 90, headerY + 5); // Centered in Particulars column
      doc.text('Amount', 170, headerY + 5); // Centered in Amount column
      
      // Service details with proper alignment
      doc.setFont('helvetica', 'normal');
      let currentY = headerY + 8;
      
      invoice.serviceDetails.forEach((service: any, index: number) => {
        const rowHeight = 12;
        
        // Draw row border
        doc.rect(15, currentY, 180, rowHeight);
        doc.rect(15, currentY, 20, rowHeight); // No. column border
        doc.rect(35, currentY, 120, rowHeight); // Particulars column border
        doc.rect(155, currentY, 40, rowHeight); // Amount column border
        
        // No. column - centered
        doc.text((index + 1).toString(), 25, currentY + 8);
        
        // Particulars column - left aligned with padding
        let description = service.description;
        
        // Handle custom services properly
        if (service.description === 'custom' && (service as any).customDescription) {
          description = (service as any).customDescription;
        }
        
        description = description + (service.notes ? ` (${service.notes})` : '');
        const maxWidth = 110; // Reduced width to fix amount column boundary
        const descriptionLines = doc.splitTextToSize(description, maxWidth);
        
        if (descriptionLines.length === 1) {
          doc.text(descriptionLines[0], 38, currentY + 8);
        } else {
          // Handle multi-line descriptions
          doc.text(descriptionLines[0], 38, currentY + 5);
          if (descriptionLines[1]) {
            doc.text(descriptionLines[1], 38, currentY + 10);
          }
        }
        
        // Amount column - right aligned with fixed boundary and proper padding
        const formattedAmount = this.formatAmount(service.amount);
        const amountText = `₹${formattedAmount}`;
        const amountWidth = doc.getTextWidth(amountText);
        doc.text(amountText, 185 - amountWidth, currentY + 8); // Column ends at 195, so 185 for more padding
        
        currentY += rowHeight;
      });
      
      // Add empty rows to fill space
      const minRows = 8;
      const currentRows = invoice.serviceDetails.length;
      for (let i = currentRows; i < minRows; i++) {
        const rowHeight = 12;
        doc.rect(15, currentY, 180, rowHeight);
        doc.rect(15, currentY, 20, rowHeight);
        doc.rect(35, currentY, 120, rowHeight);
        doc.rect(155, currentY, 40, rowHeight);
        currentY += rowHeight;
      }
      
      // Total section
      const totalRowHeight = 12;
      doc.rect(15, currentY, 180, totalRowHeight);
      doc.rect(15, currentY, 135, totalRowHeight); // Empty space
      doc.rect(150, currentY, 45, totalRowHeight); // TOTAL label and amount
      
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL', 152, currentY + 8);
      const formattedTotal = this.formatAmount(invoice.totalAmount);
      const totalText = `₹${formattedTotal}`;
      const totalWidth = doc.getTextWidth(totalText);
      doc.text(totalText, 192 - totalWidth, currentY + 8);
      
      currentY += totalRowHeight;
      
      // Amount in words and payment details section
      const paymentSectionHeight = 20;
      doc.rect(15, currentY, 120, paymentSectionHeight); // Amount in words
      doc.rect(135, currentY, 60, paymentSectionHeight); // Payment details
      
      // Split payment details into rows
      doc.rect(135, currentY, 30, 6); // Advance Rec. label
      doc.rect(165, currentY, 30, 6); // Advance amount
      doc.rect(135, currentY + 6, 30, 7); // Bill Amt. label
      doc.rect(165, currentY + 6, 30, 7); // Bill amount
      doc.rect(135, currentY + 13, 30, 7); // Net Bal. label
      doc.rect(165, currentY + 13, 30, 7); // Net balance
      
      // Amount in words
      doc.setFont('helvetica', 'normal');
      const amountInWords = this.convertAmountToWords(invoice.totalAmount);
      doc.text('Amount in words : ' + amountInWords, 18, currentY + 7);
      
      // Payment details - properly aligned
      doc.setFont('helvetica', 'bold');
      doc.text('Advance Rec.', 137, currentY + 4);
      doc.text('Bill Amt.', 137, currentY + 11);
      doc.text('Net Bal.', 137, currentY + 18);
      
      doc.setFont('helvetica', 'normal');
      const formattedAdvance = this.formatAmount(invoice.advanceReceived);
      const formattedBillAmt = this.formatAmount(invoice.totalAmount);
      const formattedNetBal = this.formatAmount(invoice.balancePayable);
      let advanceText = `₹${formattedAdvance}`;
      let billAmtText = `₹${formattedBillAmt}`;
      let netBalText = `₹${formattedNetBal}`;
      
      doc.text(advanceText, 192 - doc.getTextWidth(advanceText), currentY + 4);
      doc.text(billAmtText, 192 - doc.getTextWidth(billAmtText), currentY + 11);
      doc.text(netBalText, 192 - doc.getTextWidth(netBalText), currentY + 18);
      
      currentY += paymentSectionHeight + 5;
      
      // Bank Details section
      const bankSectionHeight = 35;
      doc.rect(15, currentY, 120, bankSectionHeight); // Bank details
      doc.rect(135, currentY, 60, bankSectionHeight); // Company signature
      
      doc.setFont('helvetica', 'bold');
      doc.text('Bank Details :', 18, currentY + 7);
      doc.setFont('helvetica', 'normal');
      
      // Extract bank details from selected bank
      const bankDetails = this.extractBankDetails(invoice.selectedBank);
      doc.text('Bank Name : ' + bankDetails.name, 18, currentY + 14);
      doc.text('A/c Holder Name : Global Financial Services', 18, currentY + 20);
      doc.text('A/c No. : ' + bankDetails.accountNumber, 18, currentY + 26);
      doc.text('IFSC Code : ' + bankDetails.ifscCode, 18, currentY + 32);
      
      // Company name and signature on right
      doc.setTextColor(52, 152, 219);
      doc.setFont('helvetica', 'bold');
      doc.text('for GLOBAL FINANCIAL', 150, currentY + 10);
      doc.text('SERVICES', 165, currentY + 17);
      
      // Signature placeholder
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.text('Authorised Signatory', 150, currentY + 32);
      
      currentY += bankSectionHeight + 10;
      
      // Footer
      doc.setFontSize(8);
      doc.text('* Subject to Nashik Jurisdiction', 18, currentY);
      
      // Return as blob for sharing
      const pdfBlob = doc.output('blob');
      resolve(pdfBlob);
    });
  }

  shareOnWhatsApp(invoice: any): void {
    // Get customer mobile number
    let customerMobile = '';
    if (invoice.customer && invoice.customer.mobile) {
      customerMobile = invoice.customer.mobile.replace(/\D/g, '');
      if (customerMobile.startsWith('91') && customerMobile.length === 12) {
        customerMobile = customerMobile.substring(2);
      }
    }

    // Create the message
    const message = `🏢 *GLOBAL FINANCIAL SERVICES*
📄 *INVOICE DETAILS*

Hello ${invoice.customer?.name || 'Customer'},

Your invoice is ready! Details below:

📋 *Invoice Information:*
• Invoice No: *${invoice.invoiceNumber}*
• Date: *${this.formatDate(invoice.invoiceDate)}*
• Total Amount: *₹${this.formatAmount(invoice.totalAmount)}*
• Balance Payable: *₹${this.formatAmount(invoice.balancePayable)}*

💼 *Services Rendered:*
${invoice.serviceDetails.map((service: any, index: number) => 
  `${index + 1}. ${service.description} - ₹${this.formatAmount(service.amount)}`
).join('\n')}

💳 *Payment Information:*
${this.getPaymentInstructions(invoice.selectedBank)}

📎 *PDF invoice is being sent separately*

Thank you for choosing our services!

*Global Financial Services*
📞 9623736781 | 9604722533
🌐 Professional Accounting & Financial Services`;

    // Generate and download PDF with customer name format
    const customerName = invoice.customer?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Customer';
    const fileName = `${customerName}_Inv_${invoice.invoiceNumber}.pdf`;
    this.generateInvoicePDF(invoice);

    // Copy message to clipboard for backup
    this.copyMessageToClipboard(message);

    // Create WhatsApp URL with message
    const encodedMessage = encodeURIComponent(message);
    let whatsappUrl = '';
    if (customerMobile) {
      whatsappUrl = `https://wa.me/91${customerMobile}?text=${encodedMessage}`;
    } else {
      whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    }

    // Show simple, clear instructions
    this.showSimpleInstructions(fileName);

    // Open WhatsApp after a short delay
    setTimeout(() => {
      window.open(whatsappUrl, '_blank');
    }, 1500);
  }

  private copyMessageToClipboard(message: string): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(message).catch(() => {
        console.log('Clipboard API not available');
      });
    }
  }

  private showSimpleInstructions(fileName: string): void {
    const instructions = `✅ Ready to Share on WhatsApp!

📱 WHAT'S HAPPENING:
• PDF "${fileName}" is downloading
• Message copied to clipboard  
• WhatsApp opening with pre-filled message

📎 TO ATTACH PDF:
1. In WhatsApp, click attachment button (📎)
2. Select "Document"
3. Choose the downloaded PDF file
4. Send message with attachment

The message is already filled in WhatsApp!`;

    alert(instructions);
  }

  private downloadPDFAndOpenWhatsApp(pdfBlob: Blob, fileName: string, message: string, customerMobile: string): void {
    // Download PDF
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Show modern instructions modal
    this.showModernInstructions(fileName, message, customerMobile);
  }

  private showModernInstructions(fileName: string, message: string, customerMobile: string): void {
    // Create a more user-friendly instruction overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: Arial, sans-serif;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 15px;
      max-width: 500px;
      width: 90%;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    `;

    modal.innerHTML = `
      <div style="color: #25D366; font-size: 48px; margin-bottom: 20px;">
        📱
      </div>
      <h2 style="color: #333; margin-bottom: 20px;">WhatsApp Sharing Guide</h2>
      <div style="text-align: left; margin-bottom: 25px; line-height: 1.6;">
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <strong>✅ Step 1:</strong> PDF "${fileName}" downloaded to your device
        </div>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <strong>📱 Step 2:</strong> WhatsApp will open with pre-filled message
        </div>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
          <strong>📎 Step 3:</strong> Click attachment button (📎) → Document → Select downloaded PDF
        </div>
      </div>
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button id="openWhatsApp" style="
          background: #25D366;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          font-weight: bold;
        ">📱 Open WhatsApp</button>
        <button id="closeModal" style="
          background: #6c757d;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
        ">Close</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Add event listeners
    document.getElementById('openWhatsApp')?.addEventListener('click', () => {
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = customerMobile 
        ? `https://wa.me/91${customerMobile}?text=${encodedMessage}`
        : `https://wa.me/?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
      document.body.removeChild(overlay);
    });

    document.getElementById('closeModal')?.addEventListener('click', () => {
      document.body.removeChild(overlay);
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });
  }

  private fallbackWhatsAppShare(invoice: any): void {
    // Traditional method as backup
    this.generateInvoicePDF(invoice);
    
    const message = `Hello ${invoice.customer?.name || 'Customer'},

Your invoice from Global Financial Services is ready.

Invoice No: ${invoice.invoiceNumber}
Date: ${this.formatDate(invoice.invoiceDate)}
Total Amount: ₹${this.formatAmount(invoice.totalAmount)}

Please check your downloads for the PDF file.

Global Financial Services
📞 9623736781 | 9604722533`;

    let customerMobile = '';
    if (invoice.customer && invoice.customer.mobile) {
      customerMobile = invoice.customer.mobile.replace(/\D/g, '');
      if (customerMobile.startsWith('91') && customerMobile.length === 12) {
        customerMobile = customerMobile.substring(2);
      }
    }

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = customerMobile 
      ? `https://wa.me/91${customerMobile}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  }

  private getPaymentInstructions(selectedBank: string): string {
    const bankDetails = this.extractBankDetails(selectedBank);
    return `💳 *Payment Options:*
🏦 Bank: ${bankDetails.name}
👤 A/c Name: Global Financial Services  
🔢 A/c No: ${bankDetails.accountNumber}
🏛️ IFSC: ${bankDetails.ifscCode}
📱 UPI: Available on request
💰 Cash: Accepted at office`;
  }

  private formatCustomerAddress(customer: any): string[] {
    const lines = [];
    if (customer.name) lines.push(customer.name);
    if (customer.mobile) lines.push(customer.mobile);
    if (customer.email) lines.push(customer.email);
    if (customer.address) {
      // Split long addresses into multiple lines
      const addressLines = customer.address.split(',');
      addressLines.forEach((line: string) => {
        if (line.trim()) lines.push(line.trim());
      });
    }
    return lines;
  }
  
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  
  private formatAmount(amount: number): string {
    // Ensure clean number formatting without any extra characters
    const cleanAmount = Number(amount) || 0;
    return cleanAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  
  private convertAmountToWords(amount: number): string {
    // Simple implementation - you can enhance this
    if (amount === 0) return 'Zero Rupees only';
    
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
                  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 
                  'Eighteen', 'Nineteen'];
    
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    function convertLessThanThousand(num: number): string {
      if (num === 0) return '';
      
      let result = '';
      
      if (num >= 100) {
        result += ones[Math.floor(num / 100)] + ' Hundred ';
        num %= 100;
      }
      
      if (num >= 20) {
        result += tens[Math.floor(num / 10)] + ' ';
        num %= 10;
      }
      
      if (num > 0) {
        result += ones[num] + ' ';
      }
      
      return result;
    }
    
    const integerPart = Math.floor(amount);
    const decimalPart = Math.round((amount - integerPart) * 100);
    
    let result = '';
    let remaining = integerPart;
    
    if (remaining >= 10000000) {
      result += convertLessThanThousand(Math.floor(remaining / 10000000)) + 'Crore ';
      remaining %= 10000000;
    }
    
    if (remaining >= 100000) {
      result += convertLessThanThousand(Math.floor(remaining / 100000)) + 'Lakh ';
      remaining %= 100000;
    }
    
    if (remaining >= 1000) {
      result += convertLessThanThousand(Math.floor(remaining / 1000)) + 'Thousand ';
      remaining %= 1000;
    }
    
    if (remaining > 0) {
      result += convertLessThanThousand(remaining);
    }
    
    result += 'Rupees';
    
    if (decimalPart > 0) {
      result += ' and ' + convertLessThanThousand(decimalPart) + 'Paise';
    }
    
    return result.trim() + ' only.';
  }
  
  private extractBankDetails(bankString: string): { name: string, accountNumber: string, ifscCode: string } {
    // Parse the bank string to extract details
    const defaultDetails = {
      name: 'HDFC Bank, Thatte Nagar Branch.',
      accountNumber: '50200107802130',
      ifscCode: 'HDFC0000064'
    };
    
    if (bankString.includes('HDFC')) {
      return {
        name: 'HDFC Bank, Thatte Nagar Branch.',
        accountNumber: '50200107802130',
        ifscCode: 'HDFC0000064'
      };
    } else if (bankString.includes('ICICI')) {
      return {
        name: 'ICICI Bank, Main Branch.',
        accountNumber: '50200107802131',
        ifscCode: 'ICIC0000065'
      };
    } else if (bankString.includes('SBI')) {
      return {
        name: 'SBI Bank, Central Branch.',
        accountNumber: '50200107802132',
        ifscCode: 'SBIN0000066'
      };
    } else if (bankString.includes('Axis')) {
      return {
        name: 'Axis Bank, City Branch.',
        accountNumber: '50200107802133',
        ifscCode: 'UTIB0000067'
      };
    }
    
    return defaultDetails;
  }
}
