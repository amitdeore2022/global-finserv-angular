import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DeviceDetectionService {

  constructor() { }

  /**
   * Detects if the app is running as PWA or on mobile device
   * @returns boolean - true if mobile or PWA, false if desktop web
   */
  isMobileOrPWA(): boolean {
    // Check if running as PWA (standalone mode)
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  (window.navigator as any).standalone || 
                  document.referrer.includes('android-app://');
    
    // Check if running on mobile device
    const isMobile = window.innerWidth <= 768 || 
                     /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    return isPWA || isMobile;
  }

  /**
   * Detects if the app is running in PWA mode specifically
   * @returns boolean - true if PWA, false otherwise
   */
  isPWA(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches || 
           (window.navigator as any).standalone || 
           document.referrer.includes('android-app://');
  }

  /**
   * Detects if the device is mobile based on screen size and user agent
   * @returns boolean - true if mobile, false otherwise
   */
  isMobile(): boolean {
    return window.innerWidth <= 768 || 
           /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Gets the current screen width
   * @returns number - current screen width in pixels
   */
  getScreenWidth(): number {
    return window.innerWidth;
  }
}
