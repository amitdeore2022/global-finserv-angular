import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, QueryDocumentSnapshot, DocumentData } from '@angular/fire/firestore';

export interface Customer {
  id?: string;
  name: string;
  mobile: string;
  gst: string;
  email: string;
  address: string;
  dueAmount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private customersCollection;
  private readonly PAGE_SIZE = 10;

  constructor(
    private firestore: Firestore
  ) {
    this.customersCollection = collection(this.firestore, 'customers');
  }

  // Add a new customer
  async addCustomer(customerData: Omit<Customer, 'id'>): Promise<string> {
    try {
      const customer = {
        ...customerData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(this.customersCollection, customer);
      return docRef.id;
    } catch (error) {
      console.error('Error adding customer:', error);
      throw error;
    }
  }

  // Get all customers
  async getCustomers(): Promise<Customer[]> {
    try {
      const q = query(this.customersCollection, orderBy('createdAt', 'asc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<Customer, 'id'>
      }));
    } catch (error) {
      console.error('Error getting customers:', error);
      throw error;
    }
  }

  // Update a customer
  async updateCustomer(customerId: string, customerData: Partial<Customer>): Promise<void> {
    try {
      const customerRef = doc(this.firestore, 'customers', customerId);
      await updateDoc(customerRef, {
        ...customerData,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  // Delete a customer
  async deleteCustomer(customerId: string): Promise<void> {
    try {
      const customerRef = doc(this.firestore, 'customers', customerId);
      await deleteDoc(customerRef);
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }

  // Get customer by ID
  async getCustomerById(customerId: string): Promise<Customer | null> {
    try {
      const customers = await this.getCustomers();
      return customers.find(customer => customer.id === customerId) || null;
    } catch (error) {
      console.error('Error getting customer by ID:', error);
      throw error;
    }
  }

  // Search customers
  async searchCustomers(searchTerm: string): Promise<Customer[]> {
    try {
      const customers = await this.getCustomers();
      return customers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.mobile.includes(searchTerm) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  }

  // ===== PAGINATED METHODS =====
}
