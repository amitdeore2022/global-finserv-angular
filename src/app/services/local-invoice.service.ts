import { Injectable } from '@angular/core';

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
    quantity: number;
    rate: number;
    amount: number;
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
export class LocalInvoiceService {
  private storageKey = 'globalfinserv_invoices';

  constructor() {}

  // Add a new invoice
  async addInvoice(invoiceData: Omit<Invoice, 'id'>): Promise<string> {
    try {
      const invoices = this.getInvoicesFromStorage();
      const newId = Date.now().toString();
      
      const invoice: Invoice = {
        id: newId,
        ...invoiceData,
      };

      invoices.unshift(invoice); // Add to beginning for recent first
      localStorage.setItem(this.storageKey, JSON.stringify(invoices));
      
      return newId;
    } catch (error) {
      console.error('Error adding invoice:', error);
      throw error;
    }
  }

  // Get all invoices
  async getInvoices(): Promise<Invoice[]> {
    try {
      return this.getInvoicesFromStorage();
    } catch (error) {
      console.error('Error getting invoices:', error);
      throw error;
    }
  }

  // Get invoice by ID
  async getInvoiceById(invoiceId: string): Promise<Invoice | null> {
    try {
      const invoices = this.getInvoicesFromStorage();
      return invoices.find(invoice => invoice.id === invoiceId) || null;
    } catch (error) {
      console.error('Error getting invoice by ID:', error);
      throw error;
    }
  }

  // Update an invoice
  async updateInvoice(invoiceId: string, invoiceData: Partial<Invoice>): Promise<void> {
    try {
      const invoices = this.getInvoicesFromStorage();
      const index = invoices.findIndex(inv => inv.id === invoiceId);
      
      if (index !== -1) {
        invoices[index] = { ...invoices[index], ...invoiceData };
        localStorage.setItem(this.storageKey, JSON.stringify(invoices));
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  }

  // Delete an invoice
  async deleteInvoice(invoiceId: string): Promise<void> {
    try {
      const invoices = this.getInvoicesFromStorage();
      const filteredInvoices = invoices.filter(inv => inv.id !== invoiceId);
      localStorage.setItem(this.storageKey, JSON.stringify(filteredInvoices));
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }

  // Search invoices
  async searchInvoices(searchTerm: string): Promise<Invoice[]> {
    try {
      const invoices = this.getInvoicesFromStorage();
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
      const invoices = this.getInvoicesFromStorage();
      return invoices.filter(invoice => invoice.status === status);
    } catch (error) {
      console.error('Error getting invoices by status:', error);
      throw error;
    }
  }

  // Get total revenue
  async getTotalRevenue(): Promise<number> {
    try {
      const invoices = this.getInvoicesFromStorage();
      return invoices.reduce((total, invoice) => total + invoice.totalAmount, 0);
    } catch (error) {
      console.error('Error getting total revenue:', error);
      return 0;
    }
  }

  // Get pending amount
  async getPendingAmount(): Promise<number> {
    try {
      const invoices = this.getInvoicesFromStorage();
      return invoices
        .filter(invoice => invoice.status === 'PENDING' || invoice.status === 'PARTIAL')
        .reduce((total, invoice) => total + invoice.balancePayable, 0);
    } catch (error) {
      console.error('Error getting pending amount:', error);
      return 0;
    }
  }

  private getInvoicesFromStorage(): Invoice[] {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : [];
  }
}
