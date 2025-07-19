import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { PdfGenerationService } from '../../services/pdf-generation.service';
import { CustomerService, Customer } from '../../services/customer.service';
import { InvoiceService, Invoice } from '../../services/invoice.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule]
})
export class DashboardComponent implements OnInit {
  activeCategory: string | null = null;
  activeSection: string | null = null;
  isRevenueMode = false;
  
  // Stats properties
  totalRevenue = 0;
  outstandingAmount = 0;
  collectionRate = 0;
  totalCustomers = 0;
  totalInvoices = 0;
  
  // Enhanced customer model to match the add-customer component
  newCustomer = {
    customerType: 'individual', // 'individual' or 'company'
    prefix: 'Mr.',
    firstName: '',
    middleName: '',
    lastName: '',
    companyName: '', // For company type
    companyType: '', // Pvt Ltd, FPCL, LLP, etc.
    mobile: '',
    countryCode: '+91',
    gst: '',
    email: '',
    flatNumber: '',
    buildingName: '',
    streetName: '',
    village: '',
    taluka: '',
    district: '',
    pincode: ''
  };
  
  customers: Array<{
    id?: string;
    name: string;
    mobile: string;
    gst: string;
    email: string;
    address: string;
    dueAmount: number;
  }> = [];

  // Stored invoices
  // Stored invoices
  invoices: Invoice[] = [];

  // Invoice search and filter properties
  invoiceSearchTerm: string = '';
  filteredInvoices: any[] = [];
  selectedInvoiceStatus: string = 'ALL';

  // Invoice-related properties
  invoice = {
    invoiceNumber: '', // Will be generated asynchronously
    invoiceDate: this.getCurrentDate(),
    customer: null as any,
    customerType: 'existing',
    searchTerm: '',
    serviceDetails: [{ description: '', amount: 0, notes: '' }],
    totalAmount: 0,
    advanceReceived: 0,
    balancePayable: 0,
    selectedBank: ''
  };

  searchResults: any[] = [];
  showAddCustomerForm = false;
  showCustomerSearch = false;

  newInvoiceCustomer = {
    id: '',
    customerType: 'individual', // 'individual' or 'company'
    prefix: 'Mr.',
    firstName: '',
    middleName: '',
    lastName: '',
    companyName: '', // For company type
    companyType: '', // Pvt Ltd, FPCL, LLP, etc.
    mobile: '',
    countryCode: '+91',
    gst: '',
    email: '',
    flatNumber: '',
    buildingName: '',
    streetName: '',
    village: '',
    taluka: '',
    district: '',
    pincode: ''
  };

  bankAccounts = [
    'HDFC Bank - Current Account (****1234)',
    'ICICI Bank - Savings Account (****5678)',
    'SBI Bank - Current Account (****9012)',
    'Axis Bank - Current Account (****3456)'
  ];

  companyTypes = [
    'Private Limited Company (Pvt Ltd)',
    'Farmer Producer Company Limited (FPCL)',
    'Limited Liability Partnership (LLP)',
    'Partnership Firm',
    'Sole Proprietorship',
    'Public Limited Company',
    'One Person Company (OPC)',
    'Section 8 Company (NGO)',
    'Producer Company',
    'Trust',
    'Society',
    'Hindu Undivided Family (HUF)'
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

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private pdfService: PdfGenerationService,
    private customerService: CustomerService,
    private invoiceService: InvoiceService
  ) {
    this.initializeInvoices();
  }

  async ngOnInit() {
    // Check for query parameters to set active category
    this.route.queryParams.subscribe(params => {
      if (params['category']) {
        this.activeCategory = params['category'];
      }
    });
    
    await this.loadCustomers();
    await this.loadInvoices();
    this.calculateStats();
    
    // Generate initial invoice number for dashboard invoice form
    this.invoice.invoiceNumber = await this.invoiceService.generateNextInvoiceNumber(this.invoice.invoiceDate);
  }

  async loadCustomers() {
    try {
      this.customers = await this.customerService.getCustomers();
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  }

  async loadInvoices() {
    try {
      this.invoices = await this.invoiceService.getInvoices();
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  }

  setActiveCategory(category: string | null) {
    this.activeCategory = category;
    this.activeSection = null; // Reset section when category changes
  }

  toggleCategory(category: string) {
    // If the clicked category is already active, close it; otherwise, open it
    if (this.activeCategory === category) {
      this.activeCategory = null;
    } else {
      this.activeCategory = category;
    }
    this.activeSection = null; // Reset section when category changes
  }

  setActiveSection(section: string | null) {
    this.activeSection = section;
  }

  get totalDueAmount(): number {
    return this.customers.reduce((sum, customer) => sum + customer.dueAmount, 0);
  }

  async addCustomer() {
    // Validate required fields based on customer type
    let isValid = false;
    let fullName = '';

    if (this.newCustomer.customerType === 'individual') {
      isValid = !!(this.newCustomer.firstName && this.newCustomer.lastName && this.newCustomer.mobile && this.newCustomer.village && this.newCustomer.district);
      fullName = `${this.newCustomer.prefix} ${this.newCustomer.firstName} ${this.newCustomer.middleName ? this.newCustomer.middleName + ' ' : ''}${this.newCustomer.lastName}`.trim();
    } else {
      isValid = !!(this.newCustomer.companyName && this.newCustomer.companyType && this.newCustomer.mobile && this.newCustomer.village && this.newCustomer.district);
      fullName = `${this.newCustomer.companyName} (${this.newCustomer.companyType})`;
    }

    if (isValid) {
      const fullAddress = `${this.newCustomer.flatNumber ? this.newCustomer.flatNumber + ', ' : ''}${this.newCustomer.buildingName ? this.newCustomer.buildingName + ', ' : ''}${this.newCustomer.streetName ? this.newCustomer.streetName + ', ' : ''}${this.newCustomer.village}, ${this.newCustomer.taluka ? this.newCustomer.taluka + ', ' : ''}${this.newCustomer.district}${this.newCustomer.pincode ? ', ' + this.newCustomer.pincode : ''}`;
      
      const customerData = {
        name: fullName,
        mobile: `${this.newCustomer.countryCode} ${this.newCustomer.mobile}`,
        gst: this.newCustomer.gst,
        email: this.newCustomer.email,
        address: fullAddress,
        dueAmount: 0 // Default to 0 since field is removed
      };

      try {
        await this.customerService.addCustomer(customerData);
        
        // Reset form
        this.newCustomer = {
          customerType: 'individual',
          prefix: 'Mr.',
          firstName: '',
          middleName: '',
          lastName: '',
          companyName: '',
          companyType: '',
          mobile: '',
          countryCode: '+91',
          gst: '',
          email: '',
          flatNumber: '',
          buildingName: '',
          streetName: '',
          village: '',
          taluka: '',
          district: '',
          pincode: ''
        };
        
        // Refresh customers list
        this.loadCustomers();
        this.activeSection = null; // Close the form after adding
      } catch (error) {
        console.error('Error adding customer:', error);
        alert('Failed to add customer. Please try again.');
      }
    }
  }

  editCustomer(customerId: string) {
    console.log('Edit customer:', customerId);
    // Future implementation for editing customer
  }

  async deleteCustomer(customerId: string) {
    if (confirm('Are you sure you want to delete this customer?')) {
      try {
        await this.customerService.deleteCustomer(customerId);
        this.loadCustomers(); // Refresh the list
        console.log('Customer deleted:', customerId);
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert('Failed to delete customer. Please try again.');
      }
    }
  }

  // Invoice-related methods
  async generateInvoiceNumber(): Promise<string> {
    return await this.invoiceService.generateNextInvoiceNumber(this.invoice.invoiceDate);
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
      this.invoice.customer = null; // Clear selected customer when search is cleared
      this.showAddCustomerForm = false; // Hide add customer form
      return;
    }

    const term = this.invoice.searchTerm.toLowerCase();
    this.searchResults = this.customers.filter(customer =>
      customer.mobile.includes(term) ||
      customer.name.toLowerCase().includes(term) ||
      customer.email.toLowerCase().includes(term)
    );

    // Clear selected customer if search term doesn't match current selection
    if (this.invoice.customer && !this.invoice.searchTerm.includes(this.invoice.customer.name)) {
      this.invoice.customer = null;
    }
  }

  selectCustomer(customer: any): void {
    this.invoice.customer = customer;
    this.searchResults = [];
    this.invoice.searchTerm = `${customer.name} (${customer.mobile})`;
    this.showAddCustomerForm = false; // Hide add customer form when existing customer is selected
    this.invoice.customerType = 'existing'; // Set to existing customer
  }

  showAddNewCustomer(): void {
    this.showAddCustomerForm = true;
    this.invoice.customerType = 'new';
    this.invoice.customer = null; // Clear any selected customer
  }

  addNewInvoiceCustomer(): void {
    let isValid = false;
    let fullName = '';

    if (this.newInvoiceCustomer.customerType === 'individual') {
      isValid = !!(this.newInvoiceCustomer.firstName && this.newInvoiceCustomer.lastName && this.newInvoiceCustomer.mobile && this.newInvoiceCustomer.village && this.newInvoiceCustomer.district);
      fullName = `${this.newInvoiceCustomer.prefix} ${this.newInvoiceCustomer.firstName} ${this.newInvoiceCustomer.middleName ? this.newInvoiceCustomer.middleName + ' ' : ''}${this.newInvoiceCustomer.lastName}`.trim();
    } else {
      isValid = !!(this.newInvoiceCustomer.companyName && this.newInvoiceCustomer.companyType && this.newInvoiceCustomer.mobile && this.newInvoiceCustomer.village && this.newInvoiceCustomer.district);
      fullName = `${this.newInvoiceCustomer.companyName} (${this.newInvoiceCustomer.companyType})`;
    }

    if (isValid) {
      const fullAddress = `${this.newInvoiceCustomer.flatNumber ? this.newInvoiceCustomer.flatNumber + ', ' : ''}${this.newInvoiceCustomer.buildingName ? this.newInvoiceCustomer.buildingName + ', ' : ''}${this.newInvoiceCustomer.streetName ? this.newInvoiceCustomer.streetName + ', ' : ''}${this.newInvoiceCustomer.village}, ${this.newInvoiceCustomer.taluka ? this.newInvoiceCustomer.taluka + ', ' : ''}${this.newInvoiceCustomer.district}${this.newInvoiceCustomer.pincode ? ', ' + this.newInvoiceCustomer.pincode : ''}`;

      const newCustomer = {
        id: Date.now().toString(), // Use timestamp as string ID
        name: fullName,
        mobile: `${this.newInvoiceCustomer.countryCode} ${this.newInvoiceCustomer.mobile}`,
        email: this.newInvoiceCustomer.email,
        address: fullAddress,
        gst: this.newInvoiceCustomer.gst,
        dueAmount: 0
      };
      
      this.customers.push(newCustomer);
      this.invoice.customer = newCustomer;
      this.showAddCustomerForm = false;
      this.invoice.searchTerm = `${newCustomer.name} (${newCustomer.mobile})`;
      
      // Reset new customer form
      this.newInvoiceCustomer = {
        id: '',
        customerType: 'individual',
        prefix: 'Mr.',
        firstName: '',
        middleName: '',
        lastName: '',
        companyName: '',
        companyType: '',
        mobile: '',
        countryCode: '+91',
        gst: '',
        email: '',
        flatNumber: '',
        buildingName: '',
        streetName: '',
        village: '',
        taluka: '',
        district: '',
        pincode: ''
      };
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

  async saveInvoice(): Promise<void> {
    if (this.validateInvoice()) {
      try {
        let customerForInvoice = this.invoice.customer;

        // If it's a new customer (from the form), add them to the customer database first
        if (this.invoice.customerType === 'new' || this.showAddCustomerForm) {
          let fullName = '';
          if (this.newInvoiceCustomer.customerType === 'individual') {
            fullName = `${this.newInvoiceCustomer.prefix} ${this.newInvoiceCustomer.firstName} ${this.newInvoiceCustomer.middleName ? this.newInvoiceCustomer.middleName + ' ' : ''}${this.newInvoiceCustomer.lastName}`.trim();
          } else {
            fullName = `${this.newInvoiceCustomer.companyName} (${this.newInvoiceCustomer.companyType})`;
          }
          
          const fullAddress = `${this.newInvoiceCustomer.flatNumber ? this.newInvoiceCustomer.flatNumber + ', ' : ''}${this.newInvoiceCustomer.buildingName ? this.newInvoiceCustomer.buildingName + ', ' : ''}${this.newInvoiceCustomer.streetName ? this.newInvoiceCustomer.streetName + ', ' : ''}${this.newInvoiceCustomer.village}, ${this.newInvoiceCustomer.taluka ? this.newInvoiceCustomer.taluka + ', ' : ''}${this.newInvoiceCustomer.district}${this.newInvoiceCustomer.pincode ? ', ' + this.newInvoiceCustomer.pincode : ''}`;
          
          const newCustomerData = {
            name: fullName,
            mobile: `${this.newInvoiceCustomer.countryCode} ${this.newInvoiceCustomer.mobile}`,
            email: this.newInvoiceCustomer.email,
            address: fullAddress,
            gst: this.newInvoiceCustomer.gst || '',
            dueAmount: 0
          };

          // Add customer to database
          const customerId = await this.customerService.addCustomer(newCustomerData);
          
          // Create customer object for invoice
          customerForInvoice = {
            id: customerId,
            name: fullName,
            mobile: `${this.newInvoiceCustomer.countryCode} ${this.newInvoiceCustomer.mobile}`,
            email: this.newInvoiceCustomer.email,
            address: fullAddress,
            gst: this.newInvoiceCustomer.gst || ''
          };

          // Refresh customers list
          await this.loadCustomers();
        }

        const serviceDetails = this.invoice.serviceDetails.map(service => ({
          description: service.description,
          quantity: 1, // Default quantity
          rate: service.amount,
          amount: service.amount
        }));

        const invoiceData = {
          invoiceNumber: this.invoice.invoiceNumber,
          invoiceDate: this.invoice.invoiceDate,
          customer: {
            id: customerForInvoice?.id,
            name: customerForInvoice?.name || '',
            mobile: customerForInvoice?.mobile || '',
            email: customerForInvoice?.email || '',
            address: customerForInvoice?.address || '',
            gst: customerForInvoice?.gst || ''
          },
          serviceDetails: serviceDetails,
          totalAmount: this.invoice.totalAmount,
          advanceReceived: this.invoice.advanceReceived,
          balancePayable: this.invoice.balancePayable,
          selectedBank: this.invoice.selectedBank,
          createdAt: new Date(),
          status: this.invoice.balancePayable > 0 ? 'PARTIAL' : 'PAID' as 'PENDING' | 'PAID' | 'PARTIAL'
        };

        // Save invoice to database
        const newInvoiceId = await this.invoiceService.addInvoice(invoiceData);
        
        // Refresh invoices list
        await this.loadInvoices();
        this.filterInvoices(); // Refresh the filtered list
        
        console.log('Invoice saved successfully');
        alert('Invoice created successfully!');
        
        // Reset invoice form
        await this.resetInvoiceForm();
        
      } catch (error) {
        console.error('Error saving invoice:', error);
        alert('Failed to save invoice. Please try again.');
      }
    }
  }

  private async resetInvoiceForm(): Promise<void> {
    this.invoice = {
      invoiceNumber: await this.generateInvoiceNumber(),
      invoiceDate: this.getCurrentDate(),
      customer: null,
      customerType: 'existing',
      searchTerm: '',
      serviceDetails: [{ description: '', amount: 0, notes: '' }],
      totalAmount: 0,
      advanceReceived: 0,
      balancePayable: 0,
      selectedBank: ''
    };

    // Reset new customer form
    this.newInvoiceCustomer = {
      id: '',
      customerType: 'individual',
      prefix: 'Mr.',
      firstName: '',
      middleName: '',
      lastName: '',
      companyName: '',
      companyType: '',
      mobile: '',
      countryCode: '+91',
      gst: '',
      email: '',
      flatNumber: '',
      buildingName: '',
      streetName: '',
      village: '',
      taluka: '',
      district: '',
      pincode: ''
    };

    this.showAddCustomerForm = false;
    this.searchResults = [];
    this.activeSection = null; // Close the form
  }

  validateInvoice(): boolean {
    // Check customer selection/creation
    if (!this.invoice.customer && this.invoice.customerType === 'existing' && !this.showAddCustomerForm) {
      alert('Please select a customer or add a new customer');
      return false;
    }

    // Check new customer form completion
    if ((this.invoice.customerType === 'new' || this.showAddCustomerForm) && 
        (!this.newInvoiceCustomer.firstName || !this.newInvoiceCustomer.lastName || !this.newInvoiceCustomer.mobile)) {
      alert('Please fill all required customer details (First Name, Last Name, Mobile)');
      return false;
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

  // Invoice viewing and search methods
  initializeInvoices(): void {
    this.filterInvoices();
  }

  filterInvoices(): void {
    let filtered = [...this.invoices];

    // Filter by search term (invoice number, customer name, or mobile)
    if (this.invoiceSearchTerm.trim()) {
      const searchTerm = this.invoiceSearchTerm.toLowerCase();
      filtered = filtered.filter(invoice =>
        invoice.invoiceNumber.toLowerCase().includes(searchTerm) ||
        invoice.customer.name.toLowerCase().includes(searchTerm) ||
        invoice.customer.mobile.includes(searchTerm) ||
        invoice.customer.email.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by status
    if (this.selectedInvoiceStatus !== 'ALL') {
      filtered = filtered.filter(invoice => invoice.status === this.selectedInvoiceStatus);
    }

    // Sort by most recent first
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    this.filteredInvoices = filtered;
  }

  onInvoiceSearch(): void {
    this.filterInvoices();
  }

  onStatusFilterChange(): void {
    this.filterInvoices();
  }

  async updateInvoiceStatus(invoiceId: string, status: 'PENDING' | 'PAID' | 'PARTIAL'): Promise<void> {
    try {
      await this.invoiceService.updateInvoice(invoiceId, { status });
      await this.loadInvoices();
      this.filterInvoices();
    } catch (error) {
      console.error('Error updating invoice status:', error);
      alert('Failed to update invoice status. Please try again.');
    }
  }

  async deleteInvoice(invoiceId: string): Promise<void> {
    if (confirm('Are you sure you want to delete this invoice?')) {
      try {
        await this.invoiceService.deleteInvoice(invoiceId);
        await this.loadInvoices();
        this.filterInvoices();
        console.log('Invoice deleted:', invoiceId);
      } catch (error) {
        console.error('Error deleting invoice:', error);
        alert('Failed to delete invoice. Please try again.');
      }
    }
  }

  printInvoice(invoiceId: string): void {
    const invoice = this.invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
      this.pdfService.generateInvoicePDF(invoice);
    } else {
      alert('Invoice not found!');
    }
  }

  shareOnWhatsApp(invoiceId: string): void {
    const invoice = this.invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
      this.pdfService.shareOnWhatsApp(invoice);
    } else {
      alert('Invoice not found!');
    }
  }

  editInvoice(invoiceId: string): void {
    console.log('Edit invoice:', invoiceId);
    // Future implementation for editing invoice
    alert('Edit functionality will be implemented soon!');
  }

  get totalInvoiceAmount(): number {
    return this.invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  }

  get totalPendingAmount(): number {
    return this.invoices.reduce((sum, invoice) => sum + invoice.balancePayable, 0);
  }

  get paidInvoicesCount(): number {
    return this.invoices.filter(invoice => invoice.status === 'PAID').length;
  }

  get pendingInvoicesCount(): number {
    return this.invoices.filter(invoice => invoice.status === 'PENDING').length;
  }

  // Revenue calculation methods
  getCurrentMonthRevenue(): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return this.invoices
      .filter(invoice => {
        const invoiceDate = new Date(invoice.invoiceDate);
        return invoiceDate.getMonth() === currentMonth && 
               invoiceDate.getFullYear() === currentYear;
      })
      .reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  }

  getLastMonthRevenue(): number {
    const lastMonth = new Date().getMonth() - 1;
    const year = lastMonth < 0 ? new Date().getFullYear() - 1 : new Date().getFullYear();
    const month = lastMonth < 0 ? 11 : lastMonth;
    
    return this.invoices
      .filter(invoice => {
        const invoiceDate = new Date(invoice.invoiceDate);
        return invoiceDate.getMonth() === month && 
               invoiceDate.getFullYear() === year;
      })
      .reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  }

  getAverageMonthlyRevenue(): number {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const recentInvoices = this.invoices.filter(invoice => 
      new Date(invoice.invoiceDate) >= sixMonthsAgo
    );
    
    const totalRevenue = recentInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    return totalRevenue / 6;
  }

  getCustomerRevenueData(): any[] {
    const customerMap = new Map();
    
    this.invoices.forEach(invoice => {
      const customerId = invoice.customer?.id || 0;
      const customerName = invoice.customer?.name || 'Unknown Customer';
      
      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          name: customerName,
          totalRevenue: 0,
          invoiceCount: 0,
          outstanding: 0
        });
      }
      
      const customer = customerMap.get(customerId);
      customer.totalRevenue += invoice.totalAmount;
      customer.invoiceCount += 1;
      customer.outstanding += invoice.balancePayable;
    });
    
    return Array.from(customerMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  getYearToDateRevenue(): number {
    const currentYear = new Date().getFullYear();
    return this.invoices
      .filter(invoice => new Date(invoice.invoiceDate).getFullYear() === currentYear)
      .reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  }

  getTotalOutstanding(): number {
    return this.invoices.reduce((sum, invoice) => sum + invoice.balancePayable, 0);
  }

  getCollectionRate(): number {
    const totalInvoiced = this.invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const totalCollected = this.invoices.reduce((sum, invoice) => sum + (invoice.totalAmount - invoice.balancePayable), 0);
    
    return totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;
  }

  getActiveCustomersCount(): number {
    const uniqueCustomers = new Set();
    this.invoices.forEach(invoice => {
      if (invoice.customer?.id) {
        uniqueCustomers.add(invoice.customer.id);
      }
    });
    return uniqueCustomers.size;
  }

  // Report generation methods (placeholder implementations)
  generateIncomeStatement(): void {
    alert('Income Statement report generation will be implemented. This will include detailed revenue, expenses, and profit analysis.');
  }

  generateGrowthReport(): void {
    alert('Growth Report generation will be implemented. This will show year-over-year and month-over-month growth trends.');
  }

  generatePaymentReport(): void {
    alert('Payment Analytics report generation will be implemented. This will show payment patterns and collection efficiency.');
  }

  generateTaxReport(): void {
    alert('Tax Summary report generation will be implemented. This will include GST and other tax summaries for compliance.');
  }

  logout(): void {
    // Clear any stored authentication data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userSession');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('username');
    sessionStorage.clear();
    
    // Show confirmation message
    alert('You have been logged out successfully!');
    
    // Navigate to login page
    this.router.navigate(['/login']);
  }

  // Navigation methods for new dashboard
  navigateToAddCustomer() {
    this.router.navigate(['/add-customer']);
  }

  navigateToViewCustomers() {
    this.router.navigate(['/view-customer']);
  }

  navigateToCreateInvoice() {
    this.router.navigate(['/create-invoice']);
  }

  navigateToViewInvoices() {
    this.router.navigate(['/view-invoices']);
  }

  // Keep old methods for backward compatibility
  navigateToCustomers() {
    this.router.navigate(['/view-customer']);
  }

  navigateToInvoices() {
    this.router.navigate(['/view-invoices']);
  }

  toggleRevenueMode() {
    this.isRevenueMode = !this.isRevenueMode;
  }

  // Calculate stats
  private calculateStats() {
    this.totalCustomers = this.customers.length;
    this.totalInvoices = this.invoices.length;
    
    this.totalRevenue = this.invoices.reduce((sum, invoice) => 
      sum + invoice.totalAmount, 0);
    
    this.outstandingAmount = this.invoices.reduce((sum, invoice) => 
      sum + invoice.balancePayable, 0);
    
    const paidAmount = this.totalRevenue - this.outstandingAmount;
    this.collectionRate = this.totalRevenue > 0 ? 
      (paidAmount / this.totalRevenue) * 100 : 0;
  }
}
