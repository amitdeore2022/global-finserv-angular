import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, doc, setDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class FirestoreSetupService {
  constructor(private firestore: Firestore) {}

  async initializeCollections(): Promise<void> {
    try {
      console.log('🔥 Initializing Firestore collections...');
      
      // Check if collections exist and create sample data if empty
      await this.createSampleCustomerIfNeeded();
      await this.createSampleInvoiceIfNeeded();
      
      console.log('✅ Firestore collections initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Firestore collections:', error);
    }
  }

  private async createSampleCustomerIfNeeded(): Promise<void> {
    try {
      const customersCollection = collection(this.firestore, 'customers');
      const customersSnapshot = await getDocs(customersCollection);
      
      if (customersSnapshot.empty) {
        console.log('📝 Creating sample customer...');
        
        const sampleCustomer = {
          name: 'John Doe',
          mobile: '+91 9876543210',
          email: 'john.doe@example.com',
          address: '123 Main Street, Mumbai, Maharashtra, 400001',
          gst: '27ABCDE1234F1Z5',
          dueAmount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await addDoc(customersCollection, sampleCustomer);
        console.log('✅ Sample customer created');
      } else {
        console.log('✅ Customers collection already has data');
      }
    } catch (error) {
      console.error('❌ Error creating sample customer:', error);
    }
  }

  private async createSampleInvoiceIfNeeded(): Promise<void> {
    try {
      const invoicesCollection = collection(this.firestore, 'invoices');
      const invoicesSnapshot = await getDocs(invoicesCollection);
      
      if (invoicesSnapshot.empty) {
        console.log('📝 Creating sample invoice...');
        
        // First, get or create a customer to link to
        const customersCollection = collection(this.firestore, 'customers');
        const customersSnapshot = await getDocs(customersCollection);
        
        let customerId = 'sample-customer-id';
        let customerData = {
          name: 'John Doe',
          mobile: '+91 9876543210',
          email: 'john.doe@example.com',
          address: '123 Main Street, Mumbai, Maharashtra, 400001',
          gst: '27ABCDE1234F1Z5'
        };
        
        if (!customersSnapshot.empty) {
          const firstCustomer = customersSnapshot.docs[0];
          customerId = firstCustomer.id;
          customerData = firstCustomer.data() as any;
        }
        
        const sampleInvoice = {
          invoiceNumber: 'INV-202507-0001',
          invoiceDate: '2025-07-19',
          customer: {
            id: customerId,
            name: customerData.name,
            mobile: customerData.mobile,
            email: customerData.email,
            address: customerData.address,
            gst: customerData.gst
          },
          serviceDetails: [
            {
              description: 'Web Development Service',
              quantity: 1,
              rate: 50000,
              amount: 50000
            },
            {
              description: 'SEO Optimization',
              quantity: 1,
              rate: 15000,
              amount: 15000
            }
          ],
          totalAmount: 65000,
          advanceReceived: 20000,
          balancePayable: 45000,
          selectedBank: 'HDFC Bank',
          status: 'PENDING' as const,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await addDoc(invoicesCollection, sampleInvoice);
        console.log('✅ Sample invoice created');
      } else {
        console.log('✅ Invoices collection already has data');
      }
    } catch (error) {
      console.error('❌ Error creating sample invoice:', error);
    }
  }

  async testFirestoreConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing Firestore connection...');
      
      const testCollection = collection(this.firestore, 'test');
      const testDoc = doc(testCollection, 'connection-test');
      
      await setDoc(testDoc, {
        timestamp: new Date(),
        message: 'Connection test successful'
      });
      
      console.log('✅ Firestore connection successful');
      return true;
    } catch (error) {
      console.error('❌ Firestore connection failed:', error);
      return false;
    }
  }
}
