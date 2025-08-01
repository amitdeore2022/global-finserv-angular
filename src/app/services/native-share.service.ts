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
        // PWA: Direct download + WhatsApp flow (skip Web Share API)
        await this.sharePWA(pdfBlob, fileName, customerName, customerMobile, invoiceNumber, totalAmount);
      }
    } catch (error) {
      console.error('Share failed:', error);
      throw error;
    }
  }

  public async sharePWA(
    pdfBlob: Blob, 
    fileName: string, 
    customerName: string, 
    customerMobile: string, 
    invoiceNumber: string,
    totalAmount: number
  ): Promise<void> {
    try {
      // Try Web Share API first (best option - no popups)
      if (navigator.share) {
        try {
          const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
          await navigator.share({
            files: [file],
            title: `Invoice ${invoiceNumber}`,
            text: `Hi ${customerName}, Your invoice ${invoiceNumber} for ₹${totalAmount}. Thank you for choosing Global Financial Services!`
          });
          return;
        } catch (shareError) {
          console.log('Web Share API failed, trying download + WhatsApp:', shareError);
        }
      }

      // Fallback: Silent download using different technique
      try {
        // Create a temporary URL for the blob
        const url = URL.createObjectURL(pdfBlob);
        
        // Try to download using fetch and save
        const response = await fetch(url);
        const blob = await response.blob();
        
        // Use a different download method that might be less intrusive
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        
        // Try to trigger download without showing popup
        link.style.position = 'fixed';
        link.style.left = '-9999px';
        link.style.opacity = '0';
        document.body.appendChild(link);
        
        // Trigger download
        link.click();
        
        // Clean up immediately
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);
        
      } catch (downloadError) {
        console.log('Silent download failed:', downloadError);
      }

      // Always open WhatsApp with message
      setTimeout(() => {
        const message = `Hi ${customerName},

📄 *Invoice ${invoiceNumber}*
💰 Amount: ₹${totalAmount}

Your invoice has been generated and downloaded to your device.

🏦 *GLOBAL FINANCIAL SERVICES*
📍 Nashik - 422003
☎️ 9623736781 | 9604722533

Thank you for your business! 🙏`;
        
        const whatsappUrl = `https://wa.me/${customerMobile}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      }, 500);

    } catch (error) {
      console.error('PWA share failed:', error);
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
