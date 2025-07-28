import { Injectable } from '@angular/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class NativeShareService {

  async shareInvoiceViaWhatsApp(
    pdfBlob: Blob, 
    fileName: string, 
    customerName: string, 
    customerMobile: string, 
    invoiceNumber: string,
    totalAmount: number
  ): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        // Native iOS/Android sharing
        await this.shareNative(pdfBlob, fileName, customerName, customerMobile, invoiceNumber, totalAmount);
      } else {
        // Web fallback (existing PWA functionality)
        await this.shareWeb(pdfBlob, fileName, customerName, customerMobile, invoiceNumber, totalAmount);
      }
    } catch (error) {
      console.error('Share failed:', error);
      throw error;
    }
  }

  private async shareNative(
    pdfBlob: Blob, 
    fileName: string, 
    customerName: string, 
    customerMobile: string, 
    invoiceNumber: string,
    totalAmount: number
  ): Promise<void> {
    try {
      // Convert blob to base64
      const base64Data = await this.blobToBase64(pdfBlob);
      
      // Save file to device storage
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
        encoding: Encoding.UTF8
      });

      // Create WhatsApp message
      const message = this.createWhatsAppMessage(customerName, invoiceNumber, totalAmount);

      // Use Capacitor Share plugin
      await Share.share({
        title: 'Invoice from Global Financial Services',
        text: message,
        files: [savedFile.uri],
        dialogTitle: 'Share Invoice via WhatsApp'
      });

      // Clean up temporary file
      await Filesystem.deleteFile({
        path: fileName,
        directory: Directory.Cache
      });

    } catch (error) {
      console.error('Native share failed:', error);
      throw error;
    }
  }

  private async shareWeb(
    pdfBlob: Blob, 
    fileName: string, 
    customerName: string, 
    customerMobile: string, 
    invoiceNumber: string,
    totalAmount: number
  ): Promise<void> {
    // Skip Web Share API for PWA to avoid download prompts
    // Instead, download PDF directly and open WhatsApp
    const message = this.createWhatsAppMessage(customerName, invoiceNumber, totalAmount);

    // Create direct download link
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.style.display = 'none';
    
    // Trigger download automatically
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    // Open WhatsApp after short delay
    setTimeout(() => {
      this.openWhatsAppWeb(customerMobile, message);
    }, 500);
  }

  private openWhatsAppWeb(mobile: string, message: string): void {
    const cleanMobile = mobile.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanMobile}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  }

  private createWhatsAppMessage(customerName: string, invoiceNumber: string, totalAmount: number): string {
    return `Hello ${customerName},

Please find attached your invoice ${invoiceNumber} for ₹${totalAmount.toFixed(2)}.

Thank you for your business!

Best regards,
Global Financial Services
ACCOUNTING & FINANCIAL SERVICES`;
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        // Remove data URL prefix
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Method to share without PDF (for quick messages)
  async shareQuickWhatsAppMessage(
    customerName: string, 
    customerMobile: string, 
    message: string
  ): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        await Share.share({
          title: 'Message from Global Financial Services',
          text: message,
          dialogTitle: 'Share via WhatsApp'
        });
      } else {
        this.openWhatsAppWeb(customerMobile, message);
      }
    } catch (error) {
      console.error('Quick share failed:', error);
      // Fallback to WhatsApp web
      this.openWhatsAppWeb(customerMobile, message);
    }
  }
}
