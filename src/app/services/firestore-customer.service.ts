import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, collectionData, doc, updateDoc, deleteDoc, query, where, orderBy } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Customer {
  id?: string;
  name: string;
  mobile: string;
  email?: string;
  address: string;
  gst?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class FirestoreCustomerService {
  constructor(private firestore: Firestore) {}

  private get customersCollection() {
    return collection(this.firestore, 'customers');
  }

  // Get all customers
  getCustomers(): Observable<Customer[]> {
    const q = query(this.customersCollection, orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Customer[]>;
  }

  // Add new customer
  async addCustomer(customer: Omit<Customer, 'id'>): Promise<string> {
    const customerData = {
      ...customer,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const docRef = await addDoc(this.customersCollection, customerData);
    return docRef.id;
  }

  // Update customer
  async updateCustomer(id: string, customer: Partial<Customer>): Promise<void> {
    const customerDoc = doc(this.firestore, 'customers', id);
    const updateData = {
      ...customer,
      updatedAt: new Date()
    };
    
    await updateDoc(customerDoc, updateData);
  }

  // Delete customer
  async deleteCustomer(id: string): Promise<void> {
    const customerDoc = doc(this.firestore, 'customers', id);
    await deleteDoc(customerDoc);
  }

  // Get customer by mobile (for uniqueness check)
  getCustomerByMobile(mobile: string): Observable<Customer[]> {
    const q = query(this.customersCollection, where('mobile', '==', mobile));
    return collectionData(q, { idField: 'id' }) as Observable<Customer[]>;
  }
}
