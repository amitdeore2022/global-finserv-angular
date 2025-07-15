import { Injectable } from '@angular/core';

export interface Customer {
  id?: string;
  name: string;
  mobile: string;
  gst: string;
  email: string;
  address: string;
  dueAmount: number;
}

@Injectable({
  providedIn: 'root'
})
export class LocalCustomerService {
  private storageKey = 'globalfinserv_customers';

  constructor() {}

  // Add a new customer
  async addCustomer(customerData: Omit<Customer, 'id'>): Promise<string> {
    try {
      const customers = this.getCustomersFromStorage();
      const newId = Date.now().toString();
      
      const customer: Customer = {
        id: newId,
        ...customerData,
      };

      customers.push(customer);
      localStorage.setItem(this.storageKey, JSON.stringify(customers));
      
      return newId;
    } catch (error) {
      console.error('Error adding customer:', error);
      throw error;
    }
  }

  // Get all customers
  async getCustomers(): Promise<Customer[]> {
    try {
      return this.getCustomersFromStorage();
    } catch (error) {
      console.error('Error getting customers:', error);
      throw error;
    }
  }

  // Update a customer
  async updateCustomer(customerId: string, customerData: Partial<Customer>): Promise<void> {
    try {
      const customers = this.getCustomersFromStorage();
      const index = customers.findIndex(c => c.id === customerId);
      
      if (index !== -1) {
        customers[index] = { ...customers[index], ...customerData };
        localStorage.setItem(this.storageKey, JSON.stringify(customers));
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  // Delete a customer
  async deleteCustomer(customerId: string): Promise<void> {
    try {
      const customers = this.getCustomersFromStorage();
      const filteredCustomers = customers.filter(c => c.id !== customerId);
      localStorage.setItem(this.storageKey, JSON.stringify(filteredCustomers));
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }

  // Search customers
  async searchCustomers(searchTerm: string): Promise<Customer[]> {
    try {
      const customers = this.getCustomersFromStorage();
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

  private getCustomersFromStorage(): Customer[] {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : [];
  }
}
