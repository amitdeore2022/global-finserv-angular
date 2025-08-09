import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, collectionData, doc, updateDoc, deleteDoc, query, where, orderBy } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

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
  paymentHistory?: Array<{
    amount: number;
    date: string;
    type: string;
    reference?: string;
    notes?: string;
  }>;
  selectedBank: string;
  status: 'PENDING' | 'PAID' | 'PARTIAL';
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class FirestoreInvoiceService {
  constructor(private firestore: Firestore) {}

  private get invoicesCollection() {
    return collection(this.firestore, 'invoices');
  }

  // Get all invoices
  getInvoices(): Observable<Invoice[]> {
    const q = query(this.invoicesCollection, orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Invoice[]>;
  }

  // Add new invoice
  async addInvoice(invoice: Omit<Invoice, 'id'>): Promise<string> {
    const invoiceData = {
      ...invoice,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const docRef = await addDoc(this.invoicesCollection, invoiceData);
    return docRef.id;
  }

  // Update invoice
  async updateInvoice(id: string, invoice: Partial<Invoice>): Promise<void> {
    const invoiceDoc = doc(this.firestore, 'invoices', id);
    const updateData = {
      ...invoice,
      updatedAt: new Date()
    };
    
    await updateDoc(invoiceDoc, updateData);
  }

  // Delete invoice
  async deleteInvoice(id: string): Promise<void> {
    const invoiceDoc = doc(this.firestore, 'invoices', id);
    await deleteDoc(invoiceDoc);
  }

  // Get invoices by customer mobile
  getInvoicesByCustomer(customerMobile: string): Observable<Invoice[]> {
    const q = query(
      this.invoicesCollection, 
      where('customer.mobile', '==', customerMobile),
      orderBy('createdAt', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Invoice[]>;
  }

  // Get invoice by invoice number
  getInvoiceByNumber(invoiceNumber: string): Observable<Invoice[]> {
    const q = query(this.invoicesCollection, where('invoiceNumber', '==', invoiceNumber));
    return collectionData(q, { idField: 'id' }) as Observable<Invoice[]>;
  }

  // Generate next invoice number
  async generateInvoiceNumber(): Promise<string> {
    const invoices = await new Promise<Invoice[]>((resolve) => {
      this.getInvoices().subscribe(data => resolve(data));
    });
    
    const lastInvoiceNumber = invoices.length > 0 ? 
      Math.max(...invoices.map(inv => parseInt(inv.invoiceNumber.replace('INV-', '')))) : 0;
    
    return `INV-${String(lastInvoiceNumber + 1).padStart(4, '0')}`;
  }
}
