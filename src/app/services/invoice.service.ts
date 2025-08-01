import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, QueryDocumentSnapshot, DocumentData } from '@angular/fire/firestore';

export interface Invoice {
  id?: string;
  invoiceNumber: string;
  invoiceDate: string;
  customer: {
    id?: string;
    name: string;
    mobile: string;
    email: string;
    address: string;
    gst: string;
  };
  serviceDetails: Array<{
    description: string;
    customDescription?: string;
    quantity: number;
    rate: number;
    amount: number;
    notes?: string;
  }>;
  totalAmount: number;
  advanceReceived: number;
  balancePayable: number;
  selectedBank: string;
  createdAt: Date;
  status: 'PENDING' | 'PAID' | 'PARTIAL';
}

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private invoicesCollection;
  private readonly PAGE_SIZE = 10;

  constructor(
    private firestore: Firestore
  ) {
    this.invoicesCollection = collection(this.firestore, 'invoices');
  }

  // Add a new invoice
  async addInvoice(invoiceData: Omit<Invoice, 'id'>): Promise<string> {
    try {
      const invoice = {
        ...invoiceData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(this.invoicesCollection, invoice);
      return docRef.id;
    } catch (error) {
      console.error('Error adding invoice:', error);
      throw error;
    }
  }

  // Get all invoices
  async getInvoices(): Promise<Invoice[]> {
    try {
      const q = query(this.invoicesCollection, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<Invoice, 'id'>
      }));
    } catch (error) {
      console.error('Error getting invoices:', error);
      throw error;
    }
  }

  // Get invoice by ID
  async getInvoiceById(invoiceId: string): Promise<Invoice | null> {
    try {
      const invoices = await this.getInvoices();
      return invoices.find(invoice => invoice.id === invoiceId) || null;
    } catch (error) {
      console.error('Error getting invoice by ID:', error);
      throw error;
    }
  }

  // Update an invoice
  async updateInvoice(invoiceId: string, invoiceData: Partial<Invoice>): Promise<void> {
    try {
      const invoiceRef = doc(this.firestore, 'invoices', invoiceId);
      await updateDoc(invoiceRef, {
        ...invoiceData,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  }

  // Delete an invoice
  async deleteInvoice(invoiceId: string): Promise<void> {
    try {
      const invoiceRef = doc(this.firestore, 'invoices', invoiceId);
      await deleteDoc(invoiceRef);
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }

  // Search invoices
  async searchInvoices(searchTerm: string): Promise<Invoice[]> {
    try {
      const invoices = await this.getInvoices();
      return invoices.filter(invoice => 
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customer.mobile.includes(searchTerm)
      );
    } catch (error) {
      console.error('Error searching invoices:', error);
      throw error;
    }
  }

  // Get invoices by status
  async getInvoicesByStatus(status: 'PENDING' | 'PAID' | 'PARTIAL'): Promise<Invoice[]> {
    try {
      const invoices = await this.getInvoices();
      return invoices.filter(invoice => invoice.status === status);
    } catch (error) {
      console.error('Error getting invoices by status:', error);
      throw error;
    }
  }

  // Get total revenue
  async getTotalRevenue(): Promise<number> {
    try {
      const invoices = await this.getInvoices();
      return invoices.reduce((total, invoice) => total + invoice.totalAmount, 0);
    } catch (error) {
      console.error('Error getting total revenue:', error);
      return 0;
    }
  }

  // Get pending amount
  async getPendingAmount(): Promise<number> {
    try {
      const invoices = await this.getInvoices();
      return invoices
        .filter(invoice => invoice.status === 'PENDING' || invoice.status === 'PARTIAL')
        .reduce((total, invoice) => total + invoice.balancePayable, 0);
    } catch (error) {
      console.error('Error getting pending amount:', error);
      return 0;
    }
  }

  // Generate next invoice number
  async generateNextInvoiceNumber(invoiceDate: string): Promise<string> {
    try {
      console.log('🔢 Generating invoice number for date:', invoiceDate);
      
      const invoices = await this.getInvoices();
      const currentDate = new Date(invoiceDate);
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const yearMonth = `${year}${month}`;
      
      console.log('📅 Year-Month:', yearMonth);
      console.log('📋 Total invoices found:', invoices.length);
      
      // Filter invoices for the current year-month
      const currentMonthInvoices = invoices.filter(invoice => {
        const invoiceDateParts = invoice.invoiceDate.split('-');
        const invoiceYear = invoiceDateParts[0];
        const invoiceMonth = invoiceDateParts[1];
        const invoiceYearMonth = `${invoiceYear}${invoiceMonth}`;
        return invoiceYearMonth === yearMonth;
      });
      
      console.log('📅 Current month invoices:', currentMonthInvoices.length);
      
      // Find the highest sequence number for this month
      let maxSequence = 0;
      currentMonthInvoices.forEach(invoice => {
        console.log('🔍 Checking invoice number:', invoice.invoiceNumber);
        const match = invoice.invoiceNumber.match(/INV-\d{6}-(\d{4})/);
        if (match) {
          const sequence = parseInt(match[1], 10);
          console.log('📊 Found sequence:', sequence);
          maxSequence = Math.max(maxSequence, sequence);
        }
      });
      
      // Generate next sequence number
      const nextSequence = maxSequence + 1;
      const sequenceStr = String(nextSequence).padStart(4, '0');
      const newInvoiceNumber = `INV-${yearMonth}-${sequenceStr}`;
      
      console.log('🎯 Max sequence found:', maxSequence);
      console.log('✨ Generated invoice number:', newInvoiceNumber);
      
      return newInvoiceNumber;
    } catch (error) {
      console.error('❌ Error generating invoice number:', error);
      // Fallback to basic format with timestamp to ensure uniqueness
      const currentDate = new Date(invoiceDate);
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const timestamp = Date.now().toString().slice(-4); // Last 4 digits of timestamp
      const fallbackNumber = `INV-${year}${month}-${timestamp}`;
      console.log('🔄 Fallback invoice number:', fallbackNumber);
      return fallbackNumber;
    }
  }
}
