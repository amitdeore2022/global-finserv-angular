                                                                                                                                                                                                                                                                                      import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { InvoiceService } from '../../services/invoice.service';
import { CustomerService, Customer as FirestoreCustomer } from '../../services/customer.service';
import { DeviceDetectionService } from '../../services/device-detection.service';

interface Customer {
  id: string;
  prefix: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface ServiceDetail {
  description: string;
  customDescription?: string;
  amount: number;
  notes: string;
}

interface Invoice {
  invoiceNumber: string;
  invoiceDate: string;
  createdBy: string;
  customer: Customer | null;
  customerType: 'existing' | 'new';
  searchTerm: string;
  serviceDetails: ServiceDetail[];
  totalAmount: number;
  advanceReceived: number;
  balancePayable: number;
  paymentHistory?: Array<{
    amount: number;
    date: string;
    type: string;
    reference?: string;
    notes?: string;
  }>;
  selectedBank: string;
  paymentType: string;
  paymentNotes: string;
}

@Component({
  selector: 'app-create-invoice',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-invoice.component.html',
  styleUrls: ['./create-invoice.component.css']
})
export class CreateInvoiceComponent implements OnInit {
  // Edit mode properties
  isEditMode = false;
  editInvoiceId: string | null = null;
  
  // Preview mode
  showPreview = false;
  savedInvoiceId: string | null = null;

  invoice: Invoice = {
    invoiceNumber: '',
    invoiceDate: this.getCurrentDate(),
    createdBy: '',
    customer: null,
    customerType: 'existing',
    searchTerm: '',
    serviceDetails: [],
    totalAmount: 0,
    advanceReceived: 0,
    balancePayable: 0,
    selectedBank: '',
    paymentType: '',
    paymentNotes: ''
  };

  // Sample existing customers (in real app, this would come from a service)
  existingCustomers: FirestoreCustomer[] = [];

  searchResults: FirestoreCustomer[] = [];
  showAddCustomerForm = false;
  showCustomerSearch = false;

  newCustomer = {
    customerType: 'individual', // 'individual' or 'company'
    prefix: 'Mr.',
    firstName: '',
    middleName: '',
    lastName: '',
    companyName: '', // For company type
    companyType: '', // For company type
    countryCode: '+91',
    mobile: '',
    gst: '',
    email: '',
    addressLine1: '',
    village: '',
    taluka: '',
    district: '',
    pinCode: ''
  };

  bankAccounts = [
    {
      id: 'hdfc_global',
      bankName: 'HDFC Bank',
      branch: 'Thatte Nagar Branch',
      accountHolder: 'Global Financial Services',
      accountNumber: '50200107802130',
      ifscCode: 'HDFC0000064',
      accountType: 'Current'
    },
    {
      id: 'icici_pravin',
      bankName: 'ICICI Bank',
      branch: '',
      accountHolder: 'PRAVIN ANNASAHEB SHINDE',
      accountNumber: '186901504098',
      ifscCode: 'ICIC0001869',
      accountType: 'Savings'
    }
  ];

  // Service options with usage tracking
  serviceOptionsWithUsage = [
    { name: 'ROC Annual Return Fees', usageCount: 0 },
    { name: 'ROC Annual Return Challan', usageCount: 0 },
    { name: 'Company Statutory Audit', usageCount: 0 },
    { name: 'Director KYC', usageCount: 0 },
    { name: 'Tax Audit', usageCount: 0 },
    { name: 'Account Writing Charges', usageCount: 0 },
    { name: 'Shop Act Fees', usageCount: 0 },
    { name: 'Udyam Registration Fees', usageCount: 0 },
    { name: 'TDS Return Fees', usageCount: 0 },
    { name: 'TDS Return Challan', usageCount: 0 },
    { name: 'Net Worth Certificate', usageCount: 0 },
    { name: 'Turnover Certificate', usageCount: 0 },
    { name: 'Working Capital Certificate', usageCount: 0 },
    { name: 'Provisional Financial Certificate', usageCount: 0 },
    { name: 'GST Registration Fees', usageCount: 0 },
    { name: 'Authorised Share Capital Fees', usageCount: 0 },
    { name: 'Allotment of Shares Fees', usageCount: 0 },
    { name: 'CS Certification Fees', usageCount: 0 },
    { name: 'Incorporation of Producer Company', usageCount: 0 },
    { name: 'ITR Filing', usageCount: 0 },
    { name: 'GST Filing', usageCount: 0 },
    { name: 'Company Registration', usageCount: 0 },
    { name: 'GST Registration', usageCount: 0 },
    { name: 'Income Tax Return', usageCount: 0 },
    { name: 'Audit Services', usageCount: 0 },
    { name: 'Compliance Services', usageCount: 0 },
    { name: 'Other Services', usageCount: 0 }
  ];

  // Get sorted service options (most used first)
  get serviceOptions(): string[] {
    return [...this.serviceOptionsWithUsage]
      .sort((a, b) => b.usageCount - a.usageCount)
      .map(service => service.name);
  }

  countryCodeOptions = [
    { code: '+91', country: 'India' },
    { code: '+1', country: 'USA' },
    { code: '+44', country: 'UK' },
    { code: '+86', country: 'China' },
    { code: '+81', country: 'Japan' }
  ];

  companyTypeOptions = ['Private Limited', 'Public Limited', 'LLP', 'Partnership', 'Sole Proprietorship', 'OPC'];

  // Payment type options
  paymentTypeOptions = [
    'Cash',
    'UPI',
    'Bank Transfer',
    'Card Payment',
    'Cheque',
    'Online Payment',
    'NEFT/RTGS',
    'Other'
  ];

  // Prefix options for customer names
  prefixOptions = [
    'Mr.',
    'Mrs.',
    'Ms.',
    'Dr.',
    'Prof.',
    'Er.',
    'Adv.',
    'CA.',
    'M/s.'
  ];

  // New service input object
  newService = {
    description: '',
    customDescription: '',
    amount: null as number | null,
    notes: ''
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private invoiceService: InvoiceService,
    private customerService: CustomerService,
    public deviceDetection: DeviceDetectionService
  ) {
    this.calculateTotals();
  }

  async ngOnInit() {
    // Initialize invoice date to current date
    this.invoice.invoiceDate = this.getCurrentDate();
    
    // Generate initial invoice number based on current date
    this.invoice.invoiceNumber = await this.generateInvoiceNumber();
    
    // Initialize invoice
    this.initializeInvoice();
    
    // Load existing customers
    this.loadCustomers();
    
    // Load service usage data
    this.loadServiceUsageData();
    
    // Check if we're in edit mode or restoring from preview
    this.route.queryParams.subscribe(params => {
      if (params['edit']) {
        this.isEditMode = true;
        this.editInvoiceId = params['edit'];
        if (this.editInvoiceId) {
          this.loadInvoiceForEdit(this.editInvoiceId);
        }
      } else if (params['mode'] === 'edit') {
        // Check if there's edit data from preview mode
        this.restoreFromPreviewEdit();
      }
    });
  }

  private restoreFromPreviewEdit() {
    try {
      const editData = sessionStorage.getItem('editInvoiceData');
      if (editData) {
        const data = JSON.parse(editData);
        console.log('Restoring from preview edit:', data);
        
        // Restore the invoice data
        if (data.invoiceData) {
          this.invoice = { ...data.invoiceData };
          
          // Ensure all required properties are set
          this.invoice.customerType = this.invoice.customerType || 'existing';
          this.invoice.invoiceDate = this.invoice.invoiceDate || this.getCurrentDate();
          
          // Ensure service details are properly formatted
          if (this.invoice.serviceDetails && Array.isArray(this.invoice.serviceDetails)) {
            this.invoice.serviceDetails = this.invoice.serviceDetails.map((service: any) => ({
              description: service.description || '',
              amount: Number(service.amount) || 0,
              notes: service.notes || ''
            }));
          } else {
            this.invoice.serviceDetails = [];
          }
          
          // Restore edit mode information
          this.isEditMode = data.isEditMode || false;
          this.editInvoiceId = data.editInvoiceId || null;
          
          // Ensure customer data is properly set
          if (this.invoice.customer) {
            this.invoice.customerType = 'existing';
          }
          
          console.log('Restored invoice:', this.invoice);
          console.log('Edit mode:', this.isEditMode);
          console.log('Edit ID:', this.editInvoiceId);
          
          // Clear the stored data after successful restoration
          sessionStorage.removeItem('editInvoiceData');
          
          // Recalculate totals
          this.calculateTotals();
        }
      }
    } catch (error) {
      console.error('Error restoring form from preview edit:', error);
      alert(`Error restoring form data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async loadCustomers() {
    try {
      this.existingCustomers = await this.customerService.getCustomers();
    } catch (error) {
      console.error('Error loading customers:', error);
      this.existingCustomers = [];
    }
  }

  async loadInvoiceForEdit(invoiceId: string) {
    try {
      console.log('Loading invoice for edit, ID:', invoiceId);
      const invoice = await this.invoiceService.getInvoiceById(invoiceId);
      console.log('Retrieved invoice:', invoice);
      
      if (invoice) {
        // Populate the form with invoice data
        this.invoice.invoiceNumber = invoice.invoiceNumber;
        this.invoice.invoiceDate = invoice.invoiceDate;
        this.invoice.createdBy = invoice.createdBy || '';
        this.invoice.totalAmount = invoice.totalAmount;
        this.invoice.advanceReceived = invoice.advanceReceived;
        this.invoice.balancePayable = invoice.balancePayable;
        this.invoice.selectedBank = invoice.selectedBank;

        // Set customer type and data
        if (invoice.customer) {
          this.invoice.customerType = 'existing';
          const customerName = invoice.customer.name || '';
          const customerAddress = invoice.customer.address || '';
          
          this.invoice.customer = {
            id: customerName,
            prefix: '',
            firstName: customerName.split(' ')[0] || '',
            lastName: customerName.split(' ').slice(1).join(' ') || '',
            mobile: invoice.customer.mobile || '',
            email: invoice.customer.email || '',
            address: customerAddress.split(',')[0] || '',
            city: '',
            state: '',
            pincode: ''
          };
        }

        // Map service details back to form format
        if (invoice.serviceDetails && Array.isArray(invoice.serviceDetails)) {
          this.invoice.serviceDetails = invoice.serviceDetails.map((service: any) => ({
            description: service.description || '',
            amount: Number(service.amount) || 0,
            notes: service.notes || ''
          }));
          console.log('Mapped service details:', this.invoice.serviceDetails);
        } else {
          console.warn('No service details found or invalid format');
          this.invoice.serviceDetails = [];
        }

        this.calculateTotals();
        console.log('Invoice form populated successfully');
      } else {
        throw new Error('Invoice not found');
      }
    } catch (error) {
      console.error('Error loading invoice for edit:', error);
      alert(`Error loading invoice data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Auto-generate invoice number based on existing invoices and selected date
  async generateInvoiceNumber(): Promise<string> {
    return await this.invoiceService.generateNextInvoiceNumber(this.invoice.invoiceDate);
  }

  // Handle invoice date change - regenerate invoice number
  async onInvoiceDateChange() {
    // Validate that the selected date is not in the future
    const selectedDate = new Date(this.invoice.invoiceDate);
    const today = new Date();
    
    // Set time to start of day for comparison
    selectedDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate > today) {
      alert('Future dates are not allowed. Please select today\'s date or an earlier date.');
      this.invoice.invoiceDate = this.getCurrentDate();
      return;
    }

    // Only regenerate invoice number if not in edit mode
    if (!this.isEditMode) {
      this.invoice.invoiceNumber = await this.generateInvoiceNumber();
    }
  }

  getCurrentDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  onCustomerTypeChange(): void {
    this.invoice.customer = null;
    this.searchResults = [];
    this.showAddCustomerForm = false;
    this.showCustomerSearch = this.invoice.customerType === 'existing';
  }

  searchCustomer(): void {
    if (!this.invoice.searchTerm.trim()) {
      this.searchResults = [];
      return;
    }

    const term = this.invoice.searchTerm.toLowerCase();
    this.searchResults = this.existingCustomers.filter(customer =>
      customer.mobile.includes(term) ||
      customer.name.toLowerCase().includes(term) ||
      customer.email.toLowerCase().includes(term)
    );
  }

  selectCustomer(customer: FirestoreCustomer): void {
    // Convert FirestoreCustomer to the format needed by the form
    this.invoice.customer = {
      id: customer.id!,
      prefix: '',
      firstName: customer.name.split(' ')[0] || '',
      lastName: customer.name.split(' ').slice(1).join(' ') || '',
      mobile: customer.mobile,
      email: customer.email,
      address: customer.address,
      city: '',
      state: '',
      pincode: ''
    };
    this.searchResults = [];
    this.invoice.searchTerm = `${customer.name} (${customer.mobile})`;
  }

  clearSelectedCustomer(): void {
    this.invoice.customer = null;
    this.invoice.searchTerm = '';
    this.searchResults = [];
  }

  showAddNewCustomer(): void {
    this.invoice.customerType = 'new'; // Automatically switch to New Customer radio button
    this.showAddCustomerForm = true;
  }

  async addNewCustomer(): Promise<void> {
    // Validate mandatory fields based on customer type
    let isValid = false;
    let fullName = '';

    if (this.newCustomer.customerType === 'individual') {
      isValid = !!(this.newCustomer.prefix && this.newCustomer.firstName && this.newCustomer.lastName && 
                   this.newCustomer.countryCode && this.newCustomer.mobile &&
                   this.newCustomer.addressLine1 && this.newCustomer.village && 
                   this.newCustomer.district);
      fullName = `${this.newCustomer.prefix} ${this.newCustomer.firstName} ${this.newCustomer.middleName ? this.newCustomer.middleName + ' ' : ''}${this.newCustomer.lastName}`.trim();
    } else if (this.newCustomer.customerType === 'company') {
      isValid = !!(this.newCustomer.companyName && this.newCustomer.companyType && 
                   this.newCustomer.countryCode && this.newCustomer.mobile &&
                   this.newCustomer.addressLine1 && this.newCustomer.village && 
                   this.newCustomer.district);
      fullName = `${this.newCustomer.companyName} (${this.newCustomer.companyType})`;
    }

    if (isValid) {
      try {
        const fullMobile = `${this.newCustomer.countryCode} ${this.newCustomer.mobile}`;
        const fullAddress = `${this.newCustomer.addressLine1}, ${this.newCustomer.village}${this.newCustomer.taluka ? ', ' + this.newCustomer.taluka : ''}, ${this.newCustomer.district}${this.newCustomer.pinCode ? ', ' + this.newCustomer.pinCode : ''}`;
        
        // Create FirestoreCustomer object for the service
        const customerData: Omit<FirestoreCustomer, 'id'> = {
          name: fullName,
          mobile: fullMobile,
          email: this.newCustomer.email || '',
          address: fullAddress,
          gst: this.newCustomer.gst || '',
          dueAmount: 0
        };
        
        // Save to service and get the ID
        const customerId = await this.customerService.addCustomer(customerData);
        
        // Create the full customer object for local use
        const newCustomer: FirestoreCustomer = {
          id: customerId,
          ...customerData
        };
        
        // Reload customers from Firestore to ensure consistency
        await this.loadCustomers();
        
        // Find and select the newly added customer
        const addedCustomer = this.existingCustomers.find(c => c.id === customerId);
        if (addedCustomer) {
          this.selectCustomer(addedCustomer);
        }
        
        this.showAddCustomerForm = false;
          // Reset new customer form
        this.newCustomer = {
          customerType: 'individual',
          prefix: 'Mr.',
          firstName: '',
          middleName: '',
          lastName: '',
          companyName: '',
          companyType: '',
          countryCode: '+91',
          mobile: '',
          gst: '',
          email: '',
          addressLine1: '',
          village: '',
          taluka: '',
          district: '',
          pinCode: ''
        };
      } catch (error) {
        console.error('Error adding customer:', error);
        alert('Error adding customer. Please try again.');
      }
    } else {
      alert('Please fill in all mandatory fields');
    }
  }

  addServiceDetail(): void {
    this.invoice.serviceDetails.push({ description: '', amount: 0, notes: '' });
  }

  removeServiceDetail(index: number): void {
    if (this.invoice.serviceDetails.length > 1) {
      this.invoice.serviceDetails.splice(index, 1);
      this.calculateTotals();
    }
  }

  calculateTotals(): void {
    this.invoice.totalAmount = this.invoice.serviceDetails.reduce(
      (sum, service) => sum + (service.amount || 0), 0
    );
    this.invoice.balancePayable = this.invoice.totalAmount - (this.invoice.advanceReceived || 0);
  }

  onAmountChange(): void {
    this.calculateTotals();
  }

  onAdvanceChange(): void {
    this.calculateTotals();
  }

  async previewInvoice(): Promise<void> {
    if (this.validateInvoice()) {
      try {
        // Prepare invoice data for preview
        const invoiceData = await this.prepareInvoiceData();
        
        // Store the invoice data temporarily in sessionStorage for preview
        sessionStorage.setItem('tempInvoiceData', JSON.stringify({
          invoiceData,
          formData: {
            invoice: this.invoice,
            newCustomer: this.newCustomer,
            isEditMode: this.isEditMode,
            editInvoiceId: this.editInvoiceId
          }
        }));
        
        // Navigate to preview page with a special parameter to indicate it's unsaved
        this.router.navigate(['/invoice-preview'], { queryParams: { mode: 'preview' } });
      } catch (error) {
        console.error('Error preparing invoice data:', error);
        alert('Error preparing invoice data. Please try again.');
      }
    } else {
      console.log('Validation failed');
    }
  }

  async updateAndPreview(): Promise<void> {
    if (this.validateInvoice()) {
      try {
        // Prepare updated invoice data for preview
        const invoiceData = await this.prepareInvoiceData();
        
        // Store the updated invoice data temporarily in sessionStorage for preview
        sessionStorage.setItem('tempInvoiceData', JSON.stringify({
          invoiceData,
          formData: {
            invoice: this.invoice,
            newCustomer: this.newCustomer,
            isEditMode: this.isEditMode,
            editInvoiceId: this.editInvoiceId
          }
        }));
        
        // Navigate to preview page with edit mode
        this.router.navigate(['/invoice-preview'], { queryParams: { mode: 'preview' } });
      } catch (error) {
        console.error('Error preparing invoice data:', error);
        alert('Error preparing invoice data. Please try again.');
      }
    } else {
      console.log('Validation failed');
    }
  }

  private async prepareInvoiceData() {
    let customerData;
    
    if (this.invoice.customerType === 'new') {
      // First, save the new customer to Firestore if not already saved
      try {
        const fullName = this.newCustomer.customerType === 'company' ? 
          this.newCustomer.companyName : 
          `${this.newCustomer.prefix} ${this.newCustomer.firstName} ${this.newCustomer.middleName ? this.newCustomer.middleName + ' ' : ''}${this.newCustomer.lastName}`.trim();
        
        const fullMobile = `${this.newCustomer.countryCode} ${this.newCustomer.mobile}`;
        const fullAddress = `${this.newCustomer.addressLine1}, ${this.newCustomer.village}, ${this.newCustomer.taluka}, ${this.newCustomer.district} - ${this.newCustomer.pinCode}`.trim();
        
        // Create FirestoreCustomer object
        const newCustomerData: Omit<FirestoreCustomer, 'id'> = {
          name: fullName,
          mobile: fullMobile,
          email: this.newCustomer.email || '',
          address: fullAddress,
          gst: this.newCustomer.gst || '',
          dueAmount: 0
        };
        
        // Save customer to Firestore and get the ID
        const customerId = await this.customerService.addCustomer(newCustomerData);
        console.log('✅ New customer saved to Firestore with ID:', customerId);
        
        // Use the saved customer data for the invoice
        customerData = {
          id: customerId,
          name: fullName,
          mobile: fullMobile,
          email: this.newCustomer.email || '',
          address: fullAddress,
          gst: this.newCustomer.gst || ''
        };
      } catch (error) {
        console.error('❌ Error saving new customer:', error);
        throw new Error('Failed to save customer. Please try again.');
      }
    } else {
      // Use existing customer data
      customerData = {
        id: this.invoice.customer!.id,
        name: this.invoice.customer!.firstName ? 
          `${this.invoice.customer!.prefix} ${this.invoice.customer!.firstName} ${this.invoice.customer!.lastName}`.trim() :
          this.invoice.customer!.id,
        mobile: this.invoice.customer!.mobile,
        email: this.invoice.customer!.email,
        address: `${this.invoice.customer!.address}, ${this.invoice.customer!.city}, ${this.invoice.customer!.state} - ${this.invoice.customer!.pincode}`,
        gst: ''
      };
    }

    // Map service details to match InvoiceService interface  
    const mappedServiceDetails = this.invoice.serviceDetails.map(service => ({
      description: service.description,
      customDescription: service.customDescription, // Preserve custom description
      quantity: 1, // Default quantity since original doesn't have it
      rate: service.amount,
      amount: service.amount,
      notes: service.notes || ''
    }));

    // Initialize payment history if advance is received
    let paymentHistory: any[] = [];
    if (this.invoice.advanceReceived > 0) {
      paymentHistory = [{
        amount: this.invoice.advanceReceived,
        date: this.invoice.invoiceDate,
        type: this.invoice.paymentType || 'Cash',
        reference: '',
        notes: this.invoice.paymentNotes || 'Initial advance payment'
      }];
    }

    return {
      invoiceNumber: this.invoice.invoiceNumber,
      invoiceDate: this.invoice.invoiceDate,
      createdBy: this.invoice.createdBy,
      customer: customerData,
      serviceDetails: mappedServiceDetails,
      totalAmount: this.invoice.totalAmount,
      advanceReceived: this.invoice.advanceReceived,
      balancePayable: this.invoice.balancePayable,
      selectedBank: this.invoice.selectedBank,
      paymentHistory: paymentHistory,
      createdAt: new Date(),
      status: this.invoice.balancePayable === 0 ? 'PAID' as const : 
             this.invoice.advanceReceived > 0 ? 'PARTIAL' as const : 'PENDING' as const
    };
  }

  async saveInvoice(): Promise<void> {
    if (this.validateInvoice()) {
      try {
        const invoiceData = await this.prepareInvoiceData();

        // Save or update invoice
        if (this.isEditMode && this.editInvoiceId) {
          // Update existing invoice
          await this.invoiceService.updateInvoice(this.editInvoiceId, invoiceData);
          this.savedInvoiceId = this.editInvoiceId;
        } else {
          // Create new invoice
          const invoiceId = await this.invoiceService.addInvoice(invoiceData);
          this.savedInvoiceId = invoiceId;
        }
        
        // Show preview mode
        this.showPreview = true;
      } catch (error) {
        console.error('Error saving invoice:', error);
        alert(this.isEditMode ? 'Error updating invoice. Please try again.' : 'Error creating invoice. Please try again.');
      }
    }
  }

  validateInvoice(): boolean {
    if (!this.invoice.createdBy) {
      alert('Please select who created this invoice');
      return false;
    }

    if (!this.invoice.customer && this.invoice.customerType === 'existing') {
      alert('Please select a customer');
      return false;
    }

    if (this.invoice.customerType === 'new') {
      let isNewCustomerValid = false;
      
      if (this.newCustomer.customerType === 'individual') {
        isNewCustomerValid = !!(this.newCustomer.firstName && this.newCustomer.lastName && 
                               this.newCustomer.mobile && this.newCustomer.addressLine1);
      } else if (this.newCustomer.customerType === 'company') {
        isNewCustomerValid = !!(this.newCustomer.companyName && this.newCustomer.companyType && 
                               this.newCustomer.mobile && this.newCustomer.addressLine1);
      }
      
      if (!isNewCustomerValid) {
        alert('Please fill all mandatory customer details');
        return false;
      }
    }

    if (this.invoice.serviceDetails.some(service => !service.description || service.amount <= 0)) {
      alert('Please fill all service details with valid amounts');
      return false;
    }

    if (!this.invoice.selectedBank) {
      alert('Please select a bank account');
      return false;
    }

    return true;
  }

  // Handle amount input focus to clear default 0
  onAmountFocus(event: any) {
    if (event.target.value === '0' || event.target.value === 0) {
      event.target.value = '';
    }
  }

  // Handle custom description focus to auto-select text
  onCustomDescriptionFocus(event: any) {
    setTimeout(() => {
      event.target.select();
    }, 0);
  }

  // Service dropdown methods
  onServiceDescriptionChange(index: number, event: any): void {
    const selectedValue = event.target.value;
    this.invoice.serviceDetails[index].description = selectedValue;
    
    // If custom is selected, clear customDescription to show input
    if (selectedValue === 'custom') {
      this.invoice.serviceDetails[index].customDescription = '';
    } else {
      // Remove customDescription if a predefined option is selected
      delete this.invoice.serviceDetails[index].customDescription;
    }
  }

  // Handle new service description change
  onNewServiceDescriptionChange(event: any) {
    const value = event.target.value;
    this.newService.description = value;
    
    if (value !== 'custom') {
      this.newService.customDescription = '';
    }
  }

  // Check if service can be added
  canAddService(): boolean {
    const hasDescription = this.newService.description && 
      (this.newService.description !== 'custom' || 
       (this.newService.description === 'custom' && this.newService.customDescription && this.newService.customDescription.trim().length > 0));
    const hasAmount = this.newService.amount !== null && this.newService.amount > 0;
    
    return !!hasDescription && hasAmount;
  }

  // Add service to the list
  addServiceToList() {
    if (this.canAddService()) {
      const serviceToAdd = {
        description: this.newService.description,
        customDescription: this.newService.customDescription,
        amount: this.newService.amount || 0,
        notes: this.newService.notes
      };
      
      this.invoice.serviceDetails.push(serviceToAdd);
      this.onAmountChange(); // Recalculate totals
      
      // Track service usage for sorting
      if (this.newService.description && this.newService.description !== 'custom') {
        this.incrementServiceUsage(this.newService.description);
      }
      
      // Reset the form
      this.newService = {
        description: '',
        customDescription: '',
        amount: null,
        notes: ''
      };
    }
  }

  // Remove service from list
  removeServiceFromList(index: number) {
    this.invoice.serviceDetails.splice(index, 1);
    this.onAmountChange(); // Recalculate totals
  }

  // Initialize invoice with empty service details array
  initializeInvoice() {
    if (!this.invoice.serviceDetails || this.invoice.serviceDetails.length === 0) {
      this.invoice.serviceDetails = [];
    }
  }

  // Get display name for service
  getServiceDisplayName(service: any) {
    if (service.description === 'custom') {
      return service.customDescription || 'Custom Service';
    }
    return service.description;
  }

  goBack(): void {
    this.router.navigate(['/dashboard'], { queryParams: { category: 'invoices' } });
  }

  // Preview mode methods
  returnToForm(): void {
    this.showPreview = false;
  }

  cancelInvoice(): void {
    // Clear any temporary data
    sessionStorage.removeItem('tempInvoiceData');
    sessionStorage.removeItem('editInvoiceData');
    
    // Navigate back to dashboard
    this.router.navigate(['/dashboard'], { queryParams: { category: 'invoices' } });
  }

  printInvoice(): void {
    if (this.savedInvoiceId) {
      // Open print dialog
      window.print();
    }
  }

  shareViaWhatsApp(): void {
    if (this.savedInvoiceId && this.invoice.customer) {
      const message = `Invoice ${this.invoice.invoiceNumber} for amount ₹${this.invoice.totalAmount} has been generated. Balance amount: ₹${this.invoice.balancePayable}`;
      const whatsappUrl = `https://wa.me/91${this.invoice.customer.mobile}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  }

  // Handle service dropdown selection - force immediate close
  onServiceChange(event: any, index: number): void {
    const selectElement = event.target;
    const selectedValue = selectElement.value;
    
    // Immediately blur to close dropdown
    setTimeout(() => {
      selectElement.blur();
    }, 10);
    
    // Update the service detail
    if (selectedValue && selectedValue !== this.invoice.serviceDetails[index]?.description) {
      this.invoice.serviceDetails[index].description = selectedValue;
      this.calculateTotals();
    }
  }

  // Handle payment type selection - force immediate close
  onPaymentTypeChange(event: any): void {
    const selectElement = event.target;
    const selectedValue = selectElement.value;
    
    // Immediately blur to close dropdown
    setTimeout(() => {
      selectElement.blur();
    }, 10);
    
    // Update payment type
    if (selectedValue) {
      this.invoice.paymentType = selectedValue;
    }
  }

  // Service usage tracking methods
  loadServiceUsageData(): void {
    try {
      const savedUsage = localStorage.getItem('serviceUsageData');
      if (savedUsage) {
        const usageData = JSON.parse(savedUsage);
        this.serviceOptionsWithUsage.forEach(service => {
          if (usageData[service.name]) {
            service.usageCount = usageData[service.name];
          }
        });
      }
    } catch (error) {
      console.error('Error loading service usage data:', error);
    }
  }

  saveServiceUsageData(): void {
    try {
      const usageData: { [key: string]: number } = {};
      this.serviceOptionsWithUsage.forEach(service => {
        usageData[service.name] = service.usageCount;
      });
      localStorage.setItem('serviceUsageData', JSON.stringify(usageData));
    } catch (error) {
      console.error('Error saving service usage data:', error);
    }
  }

  incrementServiceUsage(serviceName: string): void {
    const service = this.serviceOptionsWithUsage.find(s => s.name === serviceName);
    if (service) {
      service.usageCount++;
      this.saveServiceUsageData();
    }
  }

  // Bank account utility methods
  getBankAccountDisplayName(bankAccount: any): string {
    const maskedAccountNumber = this.getMaskedAccountNumber(bankAccount.accountNumber);
    return `${bankAccount.bankName} - ${maskedAccountNumber}`;
  }

  getMaskedAccountNumber(accountNumber: string): string {
    if (accountNumber.length <= 4) {
      return accountNumber;
    }
    const lastFour = accountNumber.slice(-4);
    const masked = 'X'.repeat(accountNumber.length - 4);
    return masked + lastFour;
  }

  getSelectedBankDetails(): any {
    return this.bankAccounts.find(bank => bank.id === this.invoice.selectedBank);
  }
}
