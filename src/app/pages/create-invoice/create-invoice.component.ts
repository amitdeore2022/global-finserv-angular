import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LocalInvoiceService } from '../../services/local-invoice.service';
import { LocalCustomerService, Customer as LocalCustomer } from '../../services/local-customer.service';

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
  customer: Customer | null;
  customerType: 'existing' | 'new';
  searchTerm: string;
  serviceDetails: ServiceDetail[];
  totalAmount: number;
  advanceReceived: number;
  balancePayable: number;
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
  existingCustomers: LocalCustomer[] = [];

  searchResults: LocalCustomer[] = [];
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
    'HDFC Bank - Current Account (****1234)',
    'ICICI Bank - Savings Account (****5678)',
    'SBI Bank - Current Account (****9012)',
    'Axis Bank - Current Account (****3456)'
  ];

  serviceOptions = [
    'Incorporation of Producer Company',
    'ITR Filing',
    'GST Filing',
    'Company Registration',
    'GST Registration',
    'Income Tax Return',
    'Audit Services',
    'Compliance Services',
    'Other Services'
  ];

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
    private invoiceService: LocalInvoiceService,
    private customerService: LocalCustomerService
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
      
      // If no customers exist, add some sample customers for testing
      if (this.existingCustomers.length === 0) {
        await this.addSampleCustomers();
        this.existingCustomers = await this.customerService.getCustomers();
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      this.existingCustomers = [];
    }
  }

  private async addSampleCustomers() {
    const sampleCustomers = [
      {
        name: 'Mr. Rahul Sharma',
        mobile: '+91 9876543210',
        email: 'rahul.sharma@email.com',
        address: '123 MG Road, Mumbai, Maharashtra - 400001',
        gst: 'GST123456789',
        dueAmount: 0
      },
      {
        name: 'Ms. Priya Patel',
        mobile: '+91 9876543211',
        email: 'priya.patel@email.com',
        address: '456 FC Road, Pune, Maharashtra - 411004',
        gst: 'GST987654321',
        dueAmount: 0
      },
      {
        name: 'Innovative Solutions Pvt Ltd',
        mobile: '+91 9876543212',
        email: 'contact@innovative.com',
        address: '789 IT Park, Bangalore, Karnataka - 560001',
        gst: 'GST456789123',
        dueAmount: 0
      }
    ];

    for (const customer of sampleCustomers) {
      try {
        await this.customerService.addCustomer(customer);
      } catch (error) {
        console.error('Error adding sample customer:', error);
      }
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

  selectCustomer(customer: LocalCustomer): void {
    // Convert LocalCustomer to the format needed by the form
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
        
        // Create LocalCustomer object for the service
        const customerData: Omit<LocalCustomer, 'id'> = {
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
        const newCustomer: LocalCustomer = {
          id: customerId,
          ...customerData
        };
        
        // Add to local array and set as selected
        this.existingCustomers.push(newCustomer);
        this.selectCustomer(newCustomer);
        
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

  previewInvoice(): void {
    if (this.validateInvoice()) {
      // Prepare invoice data for preview
      const invoiceData = this.prepareInvoiceData();
      
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
    } else {
      console.log('Validation failed');
    }
  }

  updateAndPreview(): void {
    if (this.validateInvoice()) {
      // Prepare updated invoice data for preview
      const invoiceData = this.prepareInvoiceData();
      
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
    } else {
      console.log('Validation failed');
    }
  }

  private prepareInvoiceData() {
    // Map the form data to match LocalInvoiceService interface
    const customerData = this.invoice.customerType === 'new' ? {
      name: this.newCustomer.customerType === 'company' ? 
        this.newCustomer.companyName : 
        `${this.newCustomer.prefix} ${this.newCustomer.firstName} ${this.newCustomer.middleName ? this.newCustomer.middleName + ' ' : ''}${this.newCustomer.lastName}`.trim(),
      mobile: this.newCustomer.mobile,
      email: this.newCustomer.email,
      address: `${this.newCustomer.addressLine1}, ${this.newCustomer.village}, ${this.newCustomer.taluka}, ${this.newCustomer.district} - ${this.newCustomer.pinCode}`.trim(),
      gst: this.newCustomer.gst
    } : {
      name: this.invoice.customer!.firstName ? 
        `${this.invoice.customer!.prefix} ${this.invoice.customer!.firstName} ${this.invoice.customer!.lastName}`.trim() :
        this.invoice.customer!.id,
      mobile: this.invoice.customer!.mobile,
      email: this.invoice.customer!.email,
      address: `${this.invoice.customer!.address}, ${this.invoice.customer!.city}, ${this.invoice.customer!.state} - ${this.invoice.customer!.pincode}`,
      gst: ''
    };

    // Map service details to match LocalInvoiceService interface  
    const mappedServiceDetails = this.invoice.serviceDetails.map(service => ({
      description: service.description,
      quantity: 1, // Default quantity since original doesn't have it
      rate: service.amount,
      amount: service.amount
    }));

    return {
      invoiceNumber: this.invoice.invoiceNumber,
      invoiceDate: this.invoice.invoiceDate,
      customer: customerData,
      serviceDetails: mappedServiceDetails,
      totalAmount: this.invoice.totalAmount,
      advanceReceived: this.invoice.advanceReceived,
      balancePayable: this.invoice.balancePayable,
      selectedBank: this.invoice.selectedBank,
      createdAt: new Date(),
      status: this.invoice.balancePayable === 0 ? 'PAID' as const : 
             this.invoice.advanceReceived > 0 ? 'PARTIAL' as const : 'PENDING' as const
    };
  }

  async saveInvoice(): Promise<void> {
    if (this.validateInvoice()) {
      try {
        const invoiceData = this.prepareInvoiceData();

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
}
