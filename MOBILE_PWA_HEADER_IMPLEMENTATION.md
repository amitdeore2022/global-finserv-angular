# Mobile/PWA Responsive Header Implementation

## Overview
This implementation ensures that the global header is only displayed on desktop web browsers, while mobile devices and PWA installations show individual page headers with "Back to Dashboard" buttons.

## Changes Made

### 1. Device Detection Service
**File:** `src/app/services/device-detection.service.ts`
- Created a new service to detect mobile devices and PWA mode
- Methods:
  - `isMobileOrPWA()`: Returns true if device is mobile or app is running as PWA
  - `isPWA()`: Returns true if app is running in PWA mode
  - `isMobile()`: Returns true if device is mobile
  - `getScreenWidth()`: Returns current screen width

### 2. App Component Updates
**File:** `src/app/app.component.ts`
- Added `DeviceDetectionService` import and injection
- Added `isMobileOrPWA` property
- Added `detectMobileOrPWA()` method
- Added `@HostListener('window:resize')` to re-detect on window resize
- Added `shouldShowGlobalHeader()` method that returns `!this.isMobileOrPWA && !this.isLoginPage()`

**File:** `src/app/app.component.html`
- Updated global header condition from `*ngIf="!isLoginPage()"` to `*ngIf="shouldShowGlobalHeader()"`

### 3. Individual Page Component Updates

#### Add Customer Component
**File:** `src/app/pages/add-customer/add-customer.component.ts`
- Added `DeviceDetectionService` import and injection
- Service is now public to be accessible in template

**File:** `src/app/pages/add-customer/add-customer.component.html`
- Added conditional back button: `*ngIf="deviceDetection.isMobileOrPWA()"`
- Updated header structure to use flex layout with `header-content` wrapper

**File:** `src/app/pages/add-customer/add-customer.component.css`
- Added `.header-content` flex layout styles
- Added `.back-btn` styling with proper mobile-friendly dimensions (44px min-width/height)

#### Create Invoice Component
**File:** `src/app/pages/create-invoice/create-invoice.component.ts`
- Added `DeviceDetectionService` import and injection
- Service is now public to be accessible in template

**File:** `src/app/pages/create-invoice/create-invoice.component.html`
- Added conditional back button in header with `header-content` wrapper

**File:** `src/app/pages/create-invoice/create-invoice.component.css`
- Added `.header-content` flex layout styles
- Updated `.back-btn` styling for mobile-friendly interaction

#### View Customer Component
**File:** `src/app/pages/view-customer/view-customer.component.ts`
- Added `DeviceDetectionService` import and injection
- Service is now public to be accessible in template

**File:** `src/app/pages/view-customer/view-customer.component.html`
- Added conditional back button with existing `goBack()` method

**File:** `src/app/pages/view-customer/view-customer.component.css`
- Added `.header-content` and `.back-btn` styles

#### View Invoices Component
**File:** `src/app/pages/view-invoices/view-invoices.component.ts`
- Added `DeviceDetectionService` import and injection
- Service is now public to be accessible in template

**File:** `src/app/pages/view-invoices/view-invoices.component.html`
- Added conditional back button using existing `goBackToDashboard()` method

**File:** `src/app/pages/view-invoices/view-invoices.component.css`
- Added `.header-content` and updated `.back-btn` styling

#### Invoice Preview Component
**File:** `src/app/pages/invoice-preview/invoice-preview.component.ts`
- Added `DeviceDetectionService` import and injection
- Service is now public to be accessible in template

**File:** `src/app/pages/invoice-preview/invoice-preview.component.html`
- Added conditional back button in action-buttons section

**File:** `src/app/pages/invoice-preview/invoice-preview.component.css`
- Added `.mobile-back` styling specifically for invoice preview back button

## Detection Logic

### Mobile Detection
- Screen width <= 768px
- User agent matches mobile device patterns
- Detects: Android, webOS, iPhone, iPad, iPod, BlackBerry, IEMobile, Opera Mini

### PWA Detection
- `window.matchMedia('(display-mode: standalone)').matches`
- `window.navigator.standalone` (iOS Safari)
- `document.referrer.includes('android-app://')` (Android Chrome)

## User Experience

### Desktop Web (Width > 768px, Non-PWA)
- Shows global header with company branding
- Individual pages show only their page-specific headers
- Navigation via global "Back to Dashboard" button

### Mobile Web & PWA (Width <= 768px OR PWA Mode)
- Hides global header completely
- Each page shows individual header with back button
- Back buttons use left arrow icon for intuitive navigation
- 44px minimum touch target for accessibility

## CSS Standards

### Back Button Styling
```css
.back-btn {
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 15px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 44px;
}

.back-btn:hover {
  background: #5a6268;
  transform: translateY(-1px);
}
```

### Header Content Layout
```css
.header-content {
  display: flex;
  align-items: center;
  gap: 15px;
}
```

## Benefits
1. **Better Mobile Experience**: No unnecessary global header taking up screen space
2. **PWA Native Feel**: Feels like a native app with individual page headers
3. **Consistent Navigation**: Back buttons on all relevant pages
4. **Responsive Design**: Automatically adapts based on device/mode
5. **Touch-Friendly**: 44px minimum touch targets for accessibility
6. **Performance**: Dynamic detection means no unnecessary elements are rendered

## Testing
- Test on desktop browser (width > 768px): Should show global header
- Test on mobile browser (width <= 768px): Should hide global header, show back buttons
- Test PWA installation: Should hide global header, show back buttons
- Test window resizing: Should dynamically adapt header display
