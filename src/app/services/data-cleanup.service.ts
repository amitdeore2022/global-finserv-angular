import { Injectable, inject } from '@angular/core';
import { Firestore, collection, getDocs, doc, deleteDoc, updateDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class DataCleanupService {
  private firestore = inject(Firestore);

  async cleanupDuplicateInvoiceNumbers(): Promise<void> {
    try {
      // Check if Firestore is available
      if (!this.firestore) {
        console.warn('⚠️ Firestore not available yet, skipping cleanup');
        return;
      }

      console.log('🧹 Starting invoice number cleanup...');
      
      const invoicesCollection = collection(this.firestore, 'invoices');
      const invoicesSnapshot = await getDocs(invoicesCollection);
      
      if (invoicesSnapshot.empty) {
        console.log('📋 No invoices found to clean up');
        return;
      }

      const invoices = invoicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];

      console.log(`📊 Found ${invoices.length} invoices`);

      // Group invoices by invoice number
      const invoiceGroups: { [key: string]: any[] } = {};
      invoices.forEach((invoice: any) => {
        const invoiceNumber = invoice.invoiceNumber;
        if (!invoiceGroups[invoiceNumber]) {
          invoiceGroups[invoiceNumber] = [];
        }
        invoiceGroups[invoiceNumber].push(invoice);
      });

      // Find duplicates
      const duplicates = Object.entries(invoiceGroups).filter(([_, group]) => group.length > 1);
      
      if (duplicates.length === 0) {
        console.log('✅ No duplicate invoice numbers found');
        return;
      }

      console.log(`⚠️ Found ${duplicates.length} duplicate invoice numbers:`);
      
      for (const [invoiceNumber, group] of duplicates) {
        console.log(`🔍 Invoice ${invoiceNumber} has ${group.length} duplicates`);
        
        // Sort by creation date (keep the oldest)
        group.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
          return dateA.getTime() - dateB.getTime();
        });

        // Keep the first (oldest) and delete/renumber the rest
        for (let i = 1; i < group.length; i++) {
          const duplicateInvoice = group[i];
          
          // Generate a new unique invoice number for the duplicate
          const newInvoiceNumber = await this.generateUniqueInvoiceNumber(duplicateInvoice.invoiceDate, invoices);
          
          console.log(`🔄 Renumbering duplicate invoice from ${invoiceNumber} to ${newInvoiceNumber}`);
          
          // Update the invoice with the new number
          const invoiceRef = doc(this.firestore, 'invoices', duplicateInvoice.id);
          await updateDoc(invoiceRef, {
            invoiceNumber: newInvoiceNumber,
            updatedAt: new Date()
          });
          
          // Update our local array to prevent conflicts in next iterations
          duplicateInvoice.invoiceNumber = newInvoiceNumber;
        }
      }

      console.log('✅ Duplicate invoice number cleanup completed');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }

  private async generateUniqueInvoiceNumber(invoiceDate: string, existingInvoices: any[]): Promise<string> {
    const currentDate = new Date(invoiceDate);
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const yearMonth = `${year}${month}`;
    
    // Find existing invoice numbers for this month
    const existingNumbers = existingInvoices
      .filter(inv => inv.invoiceNumber.startsWith(`INV-${yearMonth}`))
      .map(inv => inv.invoiceNumber);
    
    // Find the next available sequence number
    let sequence = 1;
    let newInvoiceNumber = `INV-${yearMonth}-${String(sequence).padStart(4, '0')}`;
    
    while (existingNumbers.includes(newInvoiceNumber)) {
      sequence++;
      newInvoiceNumber = `INV-${yearMonth}-${String(sequence).padStart(4, '0')}`;
    }
    
    return newInvoiceNumber;
  }

  async removeTestData(): Promise<void> {
    try {
      console.log('🗑️ Removing test/sample data...');
      
      const invoicesCollection = collection(this.firestore, 'invoices');
      const invoicesSnapshot = await getDocs(invoicesCollection);
      
      // Remove any test invoices (optional - be careful with this)
      const testInvoices = invoicesSnapshot.docs.filter(doc => {
        const data = doc.data() as any;
        return data['customer']?.name === 'John Doe' || 
               data['customer']?.email === 'john.doe@example.com' ||
               data['invoiceNumber'] === 'INV-202507-0001';
      });

      if (testInvoices.length > 0) {
        console.log(`🗑️ Found ${testInvoices.length} test invoices to remove`);
        
        for (const testInvoice of testInvoices) {
          await deleteDoc(doc(this.firestore, 'invoices', testInvoice.id));
          const invoiceData = testInvoice.data() as any;
          console.log(`🗑️ Removed test invoice: ${invoiceData['invoiceNumber']}`);
        }
      } else {
        console.log('📋 No test invoices found to remove');
      }

      console.log('✅ Test data cleanup completed');
    } catch (error) {
      console.error('❌ Error removing test data:', error);
    }
  }
}
