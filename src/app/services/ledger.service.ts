import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Invoice } from './local-invoice.service';
import { Customer } from './local-customer.service';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface LedgerEntry {
  date: Date;
  particulars: string;
  vchType: string;
  vchNo: string;
  debit: number;
  credit: number;
}

@Injectable({
  providedIn: 'root'
})
export class LedgerService {

  constructor() { }

  generateCustomerLedger(customer: Customer, invoices: Invoice[]): void {
    try {
      console.log('Starting ledger generation for customer:', customer.name);
      console.log('Number of invoices:', invoices.length);
      
      const doc = new jsPDF();
      console.log('jsPDF instance created successfully');
      
      const pageWidth = doc.internal.pageSize.width;
      
      // Company Header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('GLOBAL FINANCIAL SERVICES', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Office No. 4, Jay Ganesh Apartment,', pageWidth / 2, 28, { align: 'center' });
      doc.text('Opposite Thatte Nagar Bus Stop, Thatte Nagar,', pageWidth / 2, 34, { align: 'center' });
      doc.text('Nashik - 422003', pageWidth / 2, 40, { align: 'center' });
      doc.text('Mobile: 9623736781, 9604722533', pageWidth / 2, 46, { align: 'center' });
      
      // Customer Info
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${customer.name} - Ledger Account`, pageWidth / 2, 60, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Mobile: ${customer.mobile}`, 20, 72);
      if (customer.address) {
        doc.text(`Address: ${customer.address}`, 20, 78);
      }
      
      // Date range
      const today = new Date();
      const firstInvoiceDate = invoices.length > 0 ? new Date(Math.min(...invoices.map(inv => new Date(inv.invoiceDate).getTime()))) : today;
      doc.text(`Period: ${this.formatDate(firstInvoiceDate)} to ${this.formatDate(today)}`, 20, 88);
      
      // Prepare ledger entries
      const ledgerEntries: any[] = [];
      let runningBalance = 0;
      
      // Add opening balance (if any previous transactions exist)
      ledgerEntries.push([
        this.formatDate(firstInvoiceDate),
        'Opening Balance',
        '',
        '',
        '',
        '0.00',
        '0.00'
      ]);
      
      // Add invoice entries
      invoices.forEach(invoice => {
        const invoiceDate = this.formatDate(new Date(invoice.invoiceDate));
        
        // Debit entry for the total amount
        ledgerEntries.push([
          invoiceDate,
          `Invoice ${invoice.invoiceNumber}`,
          'Invoice',
          invoice.invoiceNumber,
          invoice.totalAmount.toFixed(2),
          '',
          (runningBalance + invoice.totalAmount).toFixed(2)
        ]);
        runningBalance += invoice.totalAmount;
        
        // Credit entry for advance received
        if (invoice.advanceReceived > 0) {
          ledgerEntries.push([
            invoiceDate,
            `Payment against ${invoice.invoiceNumber}`,
            'Payment',
            `PAY-${invoice.invoiceNumber}`,
            '',
            invoice.advanceReceived.toFixed(2),
            (runningBalance - invoice.advanceReceived).toFixed(2)
          ]);
          runningBalance -= invoice.advanceReceived;
        }
      });
      
      // Calculate totals
      const totalDebit = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const totalCredit = invoices.reduce((sum, inv) => sum + inv.advanceReceived, 0);
      const closingBalance = totalDebit - totalCredit;
      
      // Add closing balance
      ledgerEntries.push([
        this.formatDate(today),
        'Closing Balance',
        '',
        '',
        '',
        '',
        closingBalance.toFixed(2)
      ]);
      
      // Create table
      doc.autoTable({
        startY: 100,
        head: [['Date', 'Particulars', 'Vch Type', 'Vch No', 'Debit', 'Credit', 'Balance']],
        body: ledgerEntries,
        styles: {
          fontSize: 8,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 25 }, // Date
          1: { cellWidth: 50 }, // Particulars
          2: { cellWidth: 20 }, // Vch Type
          3: { cellWidth: 25 }, // Vch No
          4: { cellWidth: 25, halign: 'right' }, // Debit
          5: { cellWidth: 25, halign: 'right' }, // Credit
          6: { cellWidth: 25, halign: 'right' }  // Balance
        },
        didParseCell: function(data: any) {
          if (data.row.index === ledgerEntries.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [240, 240, 240];
          }
        }
      });
      
      // Add summary at bottom
      const finalY = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Debit: ₹${totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 20, finalY);
      doc.text(`Total Credit: ₹${totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 20, finalY + 8);
      doc.text(`Closing Balance: ₹${closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 20, finalY + 16);
      
      // Footer
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text('Generated by Global Financial Services', pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
      
      // Save the PDF
      const fileName = `${customer.name}_Ledger_${this.formatDate(today)}.pdf`;
      console.log('Attempting to save PDF as:', fileName);
      doc.save(fileName);
      console.log('PDF saved successfully');
      
    } catch (error) {
      console.error('Detailed error in ledger generation:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      let errorMessage = 'Failed to generate ledger. ';
      if (error instanceof Error) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Unknown error occurred.';
      }
      
      alert(errorMessage);
      throw error;
    }
  }
  
  // Test method to verify jsPDF is working
  testPDF(): void {
    try {
      console.log('Testing jsPDF...');
      const doc = new jsPDF();
      console.log('jsPDF instance created:', doc);
      console.log('autoTable function available:', typeof doc.autoTable);
      
      // Simple test
      doc.text('Test PDF', 20, 20);
      doc.save('test.pdf');
      console.log('Test PDF generated successfully');
      
    } catch (error) {
      console.error('jsPDF test failed:', error);
    }
  }

  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
  }
}
