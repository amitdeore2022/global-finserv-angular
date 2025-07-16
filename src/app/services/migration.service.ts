import { Injectable } from '@angular/core';
import { FirestoreCustomerService } from './firestore-customer.service';
import { FirestoreInvoiceService } from './firestore-invoice.service';
import { LocalCustomerService } from './local-customer.service';
import { LocalInvoiceService } from './local-invoice.service';

@Injectable({
  providedIn: 'root'
})
export class MigrationService {
  constructor(
    private firestoreCustomerService: FirestoreCustomerService,
    private firestoreInvoiceService: FirestoreInvoiceService,
    private localCustomerService: LocalCustomerService,
    private localInvoiceService: LocalInvoiceService
  ) {}

  async migrateCustomersToFirestore(): Promise<void> {
    try {
      console.log('Starting customer migration...');
      
      // Get customers from localStorage
      const localCustomers = await this.localCustomerService.getCustomers();
      
      if (localCustomers.length === 0) {
        console.log('No customers found in localStorage to migrate.');
        return;
      }

      // Migrate each customer
      for (const customer of localCustomers) {
        const { id, ...customerData } = customer; // Remove the local ID
        await this.firestoreCustomerService.addCustomer(customerData);
        console.log(`Migrated customer: ${customer.name}`);
      }

      console.log(`Successfully migrated ${localCustomers.length} customers to Firestore.`);
    } catch (error) {
      console.error('Error migrating customers:', error);
      throw error;
    }
  }

  async migrateInvoicesToFirestore(): Promise<void> {
    try {
      console.log('Starting invoice migration...');
      
      // Get invoices from localStorage
      const localInvoices = await this.localInvoiceService.getInvoices();
      
      if (localInvoices.length === 0) {
        console.log('No invoices found in localStorage to migrate.');
        return;
      }

      // Migrate each invoice
      for (const invoice of localInvoices) {
        const { id, ...invoiceData } = invoice; // Remove the local ID
        await this.firestoreInvoiceService.addInvoice(invoiceData);
        console.log(`Migrated invoice: ${invoice.invoiceNumber}`);
      }

      console.log(`Successfully migrated ${localInvoices.length} invoices to Firestore.`);
    } catch (error) {
      console.error('Error migrating invoices:', error);
      throw error;
    }
  }

  async migrateAllData(): Promise<void> {
    console.log('Starting complete data migration from localStorage to Firestore...');
    
    try {
      await this.migrateCustomersToFirestore();
      await this.migrateInvoicesToFirestore();
      
      console.log('✅ Complete migration successful!');
      console.log('You can now switch to using Firestore services in production.');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }
}
