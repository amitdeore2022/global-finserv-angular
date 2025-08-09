import { Injectable } from '@angular/core';
import { Invoice } from './local-invoice.service';
import { Customer } from './local-customer.service';

// Declare autoTable for jsPDF
declare global {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

@Injectable({
  providedIn: 'root'
})
export class SimpleLedgerService {

  constructor() { }

  async generateCustomerLedger(customer: Customer, invoices: Invoice[]): Promise<void> {
    try {
      console.log('Generating professional ledger for customer:', customer.name);
      
      // Import jsPDF dynamically with proper error handling
      const { default: jsPDF } = await import('jspdf');
      console.log('jsPDF imported successfully');
      
      // Create jsPDF instance with explicit options
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      console.log('jsPDF instance created successfully');
      
      // Try to import and setup autoTable
      let hasAutoTable = false;
      try {
        await import('jspdf-autotable');
        // Check if autoTable is available
        if (typeof (doc as any).autoTable === 'function') {
          hasAutoTable = true;
          console.log('autoTable is available');
        } else {
          console.log('autoTable function not found on doc instance');
        }
      } catch (autoTableError) {
        console.log('Failed to load autoTable, will use manual table:', autoTableError);
      }
      
      const pageWidth = doc.internal.pageSize.getWidth();
      console.log('Page width:', pageWidth);
      
      // Company Header - clean and simple
      try {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('GLOBAL FINANCIAL SERVICES', pageWidth / 2, 20, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Office No. 4, Jay Ganesh Apartment,', pageWidth / 2, 28, { align: 'center' });
        doc.text('Opposite Thatte Nagar Bus Stop, Thatte Nagar,', pageWidth / 2, 34, { align: 'center' });
        doc.text('Nashik - 422003', pageWidth / 2, 40, { align: 'center' });
        
        // Customer Details
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`${customer.name}`, pageWidth / 2, 52, { align: 'center' });
        doc.text('Ledger Account', pageWidth / 2, 60, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Mobile: ${customer.mobile}`, pageWidth / 2, 68, { align: 'center' });
        if (customer.address) {
          doc.text(`Address: ${customer.address}`, pageWidth / 2, 74, { align: 'center' });
        }
        
        // Date range
        const today = new Date();
        const firstInvoiceDate = invoices.length > 0 ? new Date(Math.min(...invoices.map(inv => new Date(inv.invoiceDate).getTime()))) : today;
        doc.text(`Period: ${this.formatDateRange(firstInvoiceDate)} to ${this.formatDateRange(today)}`, pageWidth / 2, 82, { align: 'center' });
        
        // Page number
        doc.setFontSize(8);
        doc.text('Page 1', pageWidth - 20, 82);
        
        console.log('Clean header created successfully');
      } catch (headerError) {
        console.error('Error creating header:', headerError);
        throw new Error('Failed to create PDF header');
      }
      
      // Prepare ledger data exactly like the image
      const ledgerData: any[] = [];
      let runningBalance = 0;
      
      // Sort invoices by date
      const sortedInvoices = invoices.sort((a, b) => new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime());
      
      sortedInvoices.forEach(invoice => {
        const invoiceDate = this.formatDateShort(new Date(invoice.invoiceDate));
        
        // Sales entry (Debit to customer)
        runningBalance += invoice.totalAmount;
        ledgerData.push([
          invoiceDate,
          `By Sales A/c (against Invoice)`,
          'Sales Invoice',
          invoice.invoiceNumber,
          this.formatAmount(invoice.totalAmount),
          '',
          this.formatAmount(runningBalance)
        ]);
        
        // Add individual payment entries from payment history
        if (invoice.paymentHistory && invoice.paymentHistory.length > 0) {
          invoice.paymentHistory.forEach((payment, index) => {
            runningBalance -= payment.amount;
            const paymentRef = payment.reference ? payment.reference : `PAY-${invoice.invoiceNumber}-${index + 1}`;
            ledgerData.push([
              this.formatDateShort(new Date(payment.date)),
              `To Cash/Bank A/c (${payment.type} payment)`,
              payment.type,
              paymentRef,
              '',
              this.formatAmount(payment.amount),
              this.formatAmount(runningBalance)
            ]);
          });
        } else if (invoice.advanceReceived > 0) {
          // Fallback for existing invoices without payment history
          runningBalance -= invoice.advanceReceived;
          ledgerData.push([
            invoiceDate,
            `To Cash/Bank A/c (against payment)`,
            'Bank Payment',
            `PAY-${invoice.invoiceNumber}`,
            '',
            this.formatAmount(invoice.advanceReceived),
            this.formatAmount(runningBalance)
          ]);
        }
      });
      
      // Add closing balance row
      const totalDebit = sortedInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const totalCredit = sortedInvoices.reduce((sum, inv) => sum + inv.advanceReceived, 0);
      const closingBalance = totalDebit - totalCredit;
      
      ledgerData.push([
        '',
        'Closing Balance',
        '',
        '',
        this.formatAmount(totalDebit),
        this.formatAmount(totalCredit),
        this.formatAmount(closingBalance)
      ]);
      
      // Create the table using autoTable - exactly matching the image format
      if (hasAutoTable) {
        console.log('Using autoTable for professional layout');
        try {
          (doc as any).autoTable({
            head: [['Date', 'Particulars', 'Vch Type', 'Vch No.', 'Debit', 'Credit', 'Balance']],
            body: ledgerData,
            startY: 90,
            theme: 'grid',
            styles: { 
              fontSize: 8,
              cellPadding: 2,
              lineWidth: 0.5,
              lineColor: [0, 0, 0],
              textColor: [0, 0, 0]
            },
            headStyles: { 
              fillColor: [255, 255, 255], // White background
              textColor: [0, 0, 0],        // Black text
              fontStyle: 'bold',
              halign: 'center',
              lineWidth: 0.5,
              lineColor: [0, 0, 0]
            },
            columnStyles: {
              0: { cellWidth: 20, halign: 'center' }, // Date
              1: { cellWidth: 48, halign: 'left' },   // Particulars
              2: { cellWidth: 22, halign: 'center' }, // Vch Type
              3: { cellWidth: 22, halign: 'center' }, // Vch No
              4: { cellWidth: 20, halign: 'right' },  // Debit
              5: { cellWidth: 20, halign: 'right' },  // Credit
              6: { cellWidth: 24, halign: 'right' }   // Balance
            },
            margin: { left: 14, right: 14 },
            didParseCell: function(data: any) {
              // Make the closing balance row bold
              if (data.row.index === ledgerData.length - 1) {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fillColor = [255, 255, 255]; // White background
              }
            }
          });
          console.log('autoTable created successfully');
        } catch (autoTableError) {
          console.error('Error with autoTable, falling back to manual:', autoTableError);
          this.createManualTable(doc, ledgerData);
        }
      } else {
        console.log('autoTable not available, using manual table layout');
        this.createManualTable(doc, ledgerData);
      }
      
      // Footer
      try {
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text('Generated by Global Financial Services', pageWidth / 2, pageHeight - 10, { align: 'center' });
        doc.text(`Generated on: ${this.formatDateTime(new Date())}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
        console.log('Footer created successfully');
      } catch (footerError) {
        console.error('Error creating footer:', footerError);
        // Continue without footer if there's an error
      }
      
      // Save the PDF
      try {
        const fileName = `${customer.name}_Ledger_${this.formatDate(new Date())}.pdf`;
        console.log('Saving professional ledger as:', fileName);
        doc.save(fileName);
        console.log('Professional ledger PDF saved successfully');
      } catch (saveError) {
        console.error('Error saving PDF:', saveError);
        throw new Error('Failed to save PDF file');
      }
      
    } catch (error) {
      console.error('Error in professional ledger generation:', error);
      
      let errorMessage = 'Error generating ledger: ';
      if (error instanceof Error) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Unknown error occurred.';
      }
      
      alert(errorMessage);
      throw error;
    }
  }
  
  private createManualTable(doc: any, ledgerData: any[]): void {
    try {
      console.log('Creating clean manual table layout');
      
      const startY = 90;
      const rowHeight = 8;
      const colWidths = [20, 48, 22, 22, 20, 20, 24]; // Properly sized columns
      const startX = 14;
      
      // Draw header
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      
      const headers = ['Date', 'Particulars', 'Vch Type', 'Vch No.', 'Debit', 'Credit', 'Balance'];
      let headerX = startX;
      
      // Header text (no background color)
      headers.forEach((header, i) => {
        try {
          doc.text(header, headerX + colWidths[i]/2, startY + 5, { align: 'center' });
        } catch (textError) {
          doc.text(header, headerX + colWidths[i]/2, startY + 5);
        }
        headerX += colWidths[i];
      });
      
      // Draw table content
      doc.setFont('helvetica', 'normal');
      let currentY = startY + rowHeight;
      
      ledgerData.forEach((row, rowIndex) => {
        let cellX = startX;
        
        // Make closing balance row bold
        if (rowIndex === ledgerData.length - 1) {
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setFont('helvetica', 'normal');
        }
        
        row.forEach((cell: any, colIndex: number) => {
          const cellValue = cell || '';
          
          try {
            // Right align numeric columns (Debit, Credit, Balance)
            if (colIndex >= 4) {
              doc.text(cellValue, cellX + colWidths[colIndex] - 2, currentY + 5, { align: 'right' });
            } else if (colIndex === 0 || colIndex === 2 || colIndex === 3) {
              // Center align Date, Vch Type, Vch No
              doc.text(cellValue, cellX + colWidths[colIndex]/2, currentY + 5, { align: 'center' });
            } else {
              // Left align Particulars - truncate if too long
              let displayText = cellValue;
              const maxChars = 30; // Limit characters for particulars
              if (displayText.length > maxChars) {
                displayText = displayText.substring(0, maxChars - 3) + '...';
              }
              doc.text(displayText, cellX + 2, currentY + 5);
            }
          } catch (textError) {
            // Fallback without align options
            doc.text(cellValue.toString().substring(0, 15), cellX + 2, currentY + 5);
          }
          
          cellX += colWidths[colIndex];
        });
        
        currentY += rowHeight;
      });
      
      // Draw clean table borders
      try {
        doc.setLineWidth(0.5);
        doc.setDrawColor(0, 0, 0); // Black borders
        
        // Vertical lines
        let borderX = startX;
        for (let i = 0; i <= colWidths.length; i++) {
          doc.line(borderX, startY, borderX, currentY);
          if (i < colWidths.length) {
            borderX += colWidths[i];
          }
        }
        
        // Horizontal lines
        for (let i = 0; i <= ledgerData.length + 1; i++) {
          const y = startY + (i * rowHeight);
          doc.line(startX, y, startX + colWidths.reduce((a, b) => a + b, 0), y);
        }
      } catch (borderError) {
        console.warn('Border drawing failed, continuing without borders');
      }
      
      console.log('Clean manual table created successfully');
    } catch (error) {
      console.error('Error in manual table creation:', error);
      throw new Error('Failed to create table layout');
    }
  }

  private formatAmount(amount: number): string {
    return amount.toLocaleString('en-IN', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  }
  
  private formatDateShort(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear().toString().substr(-2);
    return `${day}-${month}-${year}`;
  }
  
  private formatDateRange(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear().toString().substr(-2);
    return `${day}-${month}-${year}`;
  }
  
  private formatDateTime(date: Date): string {
    return date.toLocaleDateString('en-IN') + ' ' + date.toLocaleTimeString('en-IN');
  }
  
  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
}
