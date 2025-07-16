import { Injectable } from '@angular/core';
import { Invoice } from './local-invoice.service';
import { Customer } from './local-customer.service';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

@Injectable({
  providedIn: 'root'
})
export class LedgerGenerationService {

  constructor() { }

  generateCustomerLedger(customer: Customer, invoices: Invoice[]) {
    const doc = new jsPDF();
    
    // Company Details
    const companyInfo = {
      name: 'GLOBAL FINANCIAL SERVICES',
      address: 'Nashik - 422003',
      phone: '9623736781 | 9604722533',
      email: 'info@globalfinancialservices.com',
      gstin: 'GSTIN: 27ABCDE1234F1Z5'
    };

    // Header - Ledger Format
    doc.setFillColor(76, 128, 76); // Green color matching the image
    doc.rect(10, 10, 190, 15, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Ledger Format', 105, 22, { align: 'center' });

    // Company Details Section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Company Name:', 15, 35);
    doc.setFont('helvetica', 'normal');
    doc.text(companyInfo.name, 65, 35);

    doc.setFont('helvetica', 'bold');
    doc.text('Address:', 15, 45);
    doc.setFont('helvetica', 'normal');
    doc.text(companyInfo.address, 65, 45);

    doc.setFont('helvetica', 'bold');
    doc.text('Phone No.:', 15, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(companyInfo.phone, 65, 55);

    doc.setFont('helvetica', 'bold');
    doc.text('Email ID:', 120, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(companyInfo.email, 150, 55);

    doc.setFont('helvetica', 'bold');
    doc.text('GSTIN No.:', 15, 65);
    doc.setFont('helvetica', 'normal');
    doc.text(companyInfo.gstin, 65, 65);

    doc.setFont('helvetica', 'bold');
    doc.text('Time Period:', 120, 65);
    doc.setFont('helvetica', 'normal');
    const fromDate = new Date(Math.min(...invoices.map(inv => new Date(inv.invoiceDate).getTime())));
    const toDate = new Date(Math.max(...invoices.map(inv => new Date(inv.invoiceDate).getTime())));
    doc.text(`${fromDate.toLocaleDateString('en-IN')} to ${toDate.toLocaleDateString('en-IN')}`, 150, 65);

    // Customer Details Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Customer Ledger - ${customer.name}`, 15, 80);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Mobile: ${customer.mobile}`, 15, 88);
    doc.text(`Address: ${customer.address}`, 15, 95);
    if (customer.email) {
      doc.text(`Email: ${customer.email}`, 15, 102);
    }

    // Table Headers
    const tableHeaders = [
      'Date',
      'Credit/Debit',
      'Particulars', 
      'Voucher Type',
      'Voucher Number',
      'Debit',
      'Credit'
    ];

    // Prepare table data
    const tableData: any[] = [];
    let runningBalance = 0;
    
    // Sort invoices by date
    const sortedInvoices = invoices.sort((a, b) => 
      new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime()
    );

    // Add opening balance row
    tableData.push([
      '',
      '',
      'Opening Balance',
      '',
      '',
      '',
      '0.00'
    ]);

    // Process each invoice
    sortedInvoices.forEach(invoice => {
      const invoiceDate = new Date(invoice.invoiceDate).toLocaleDateString('en-IN');
      
      // Service details as particulars
      const serviceDetails = invoice.serviceDetails.map(service => service.description).join(', ');
      
      // Invoice creation entry (Credit/Income for company)
      tableData.push([
        invoiceDate,
        'Cr',
        `Invoice: ${serviceDetails}`,
        'Invoice',
        invoice.invoiceNumber,
        '',
        invoice.totalAmount.toFixed(2)
      ]);
      runningBalance += invoice.totalAmount;

      // If advance received, add debit entry
      if (invoice.advanceReceived > 0) {
        tableData.push([
          invoiceDate,
          'Dr',
          'Payment Received',
          'Receipt',
          `RCP-${invoice.invoiceNumber}`,
          invoice.advanceReceived.toFixed(2),
          ''
        ]);
        runningBalance -= invoice.advanceReceived;
      }
    });

    // Calculate totals
    const totalDebits = tableData.reduce((sum, row) => {
      const debitValue = parseFloat(row[5]) || 0;
      return sum + debitValue;
    }, 0);

    const totalCredits = tableData.reduce((sum, row) => {
      const creditValue = parseFloat(row[6]) || 0;
      return sum + creditValue;
    }, 0);

    // Add totals row
    tableData.push([
      '',
      '',
      'Total',
      '',
      '',
      totalDebits.toFixed(2),
      totalCredits.toFixed(2)
    ]);

    // Add closing balance
    const closingBalance = totalCredits - totalDebits;
    tableData.push([
      '',
      '',
      'Closing Balance',
      '',
      '',
      '',
      Math.abs(closingBalance).toFixed(2)
    ]);

    // Generate table
    (doc as any).autoTable({
      head: [tableHeaders],
      body: tableData,
      startY: 110,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
        overflow: 'linebreak',
        halign: 'center'
      },
      headStyles: {
        fillColor: [76, 128, 76], // Green header
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' }, // Date
        1: { cellWidth: 15, halign: 'center' }, // Credit/Debit
        2: { cellWidth: 60, halign: 'left' },   // Particulars
        3: { cellWidth: 25, halign: 'center' }, // Voucher Type
        4: { cellWidth: 30, halign: 'center' }, // Voucher Number
        5: { cellWidth: 20, halign: 'right' },  // Debit
        6: { cellWidth: 20, halign: 'right' }   // Credit
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { left: 10, right: 10 }
    });

    // Footer with summary
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    
    // Summary box
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(120, finalY, 80, 40);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary:', 125, finalY + 8);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Invoiced: ₹${totalCredits.toFixed(2)}`, 125, finalY + 16);
    doc.text(`Total Received: ₹${totalDebits.toFixed(2)}`, 125, finalY + 24);
    doc.text(`Outstanding: ₹${Math.abs(closingBalance).toFixed(2)}`, 125, finalY + 32);

    // Save the PDF
    const fileName = `Ledger_${customer.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  // Generate ledger data for display (without PDF)
  getLedgerData(customer: Customer, invoices: Invoice[]) {
    const ledgerEntries: any[] = [];
    let runningBalance = 0;
    
    // Sort invoices by date
    const sortedInvoices = invoices.sort((a, b) => 
      new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime()
    );

    // Add opening balance
    ledgerEntries.push({
      date: '',
      creditDebit: '',
      particulars: 'Opening Balance',
      voucherType: '',
      voucherNumber: '',
      debit: 0,
      credit: 0,
      balance: 0
    });

    // Process each invoice
    sortedInvoices.forEach(invoice => {
      // Invoice entry (Credit)
      runningBalance += invoice.totalAmount;
      ledgerEntries.push({
        date: new Date(invoice.invoiceDate),
        creditDebit: 'Cr',
        particulars: `Invoice: ${invoice.serviceDetails.map(s => s.description).join(', ')}`,
        voucherType: 'Invoice',
        voucherNumber: invoice.invoiceNumber,
        debit: 0,
        credit: invoice.totalAmount,
        balance: runningBalance
      });

      // Payment entry (Debit) if advance received
      if (invoice.advanceReceived > 0) {
        runningBalance -= invoice.advanceReceived;
        ledgerEntries.push({
          date: new Date(invoice.invoiceDate),
          creditDebit: 'Dr',
          particulars: 'Payment Received',
          voucherType: 'Receipt',
          voucherNumber: `RCP-${invoice.invoiceNumber}`,
          debit: invoice.advanceReceived,
          credit: 0,
          balance: runningBalance
        });
      }
    });

    return {
      entries: ledgerEntries,
      summary: {
        totalInvoiced: ledgerEntries.reduce((sum, entry) => sum + entry.credit, 0),
        totalReceived: ledgerEntries.reduce((sum, entry) => sum + entry.debit, 0),
        outstanding: runningBalance
      }
    };
  }
}
