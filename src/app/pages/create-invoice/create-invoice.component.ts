import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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
}

@Component({
  selector: 'app-create-invoice',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-invoice.component.html',
  styleUrls: ['./create-invoice.component.css']
})
export class CreateInvoiceComponent {
  invoice: Invoice = {
    invoiceNumber: this.generateInvoiceNumber(),
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

  // Sample existing customers (in real app, this would come from a service)
  existingCustomers: Customer[] = [
    {
      id: '1',
      prefix: 'Mr.',
      firstName: 'Rahul',
      lastName: 'Sharma',
      mobile: '9876543210',
      email: 'rahul.sharma@email.com',
      address: '123 MG Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001'
    },
    {
      id: '2',
      prefix: 'Ms.',
      firstName: 'Priya',
      lastName: 'Patel',
      mobile: '9876543211',
      email: 'priya.patel@email.com',
      address: '456 FC Road',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411004'
    }
  ];

  searchResults: Customer[] = [];
  showAddCustomerForm = false;
  showCustomerSearch = false;

  newCustomer: Customer = {
    id: '',
    prefix: 'Mr.',
    firstName: '',
    lastName: '',
    mobile: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
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

  constructor(private router: Router) {
    this.calculateTotals();
  }

  generateInvoiceNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${year}${month}-${random}`;
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
      customer.firstName.toLowerCase().includes(term) ||
      customer.lastName.toLowerCase().includes(term) ||
      customer.email.toLowerCase().includes(term)
    );
  }

  selectCustomer(customer: Customer): void {
    this.invoice.customer = customer;
    this.searchResults = [];
    this.invoice.searchTerm = `${customer.firstName} ${customer.lastName} (${customer.mobile})`;
  }

  showAddNewCustomer(): void {
    this.showAddCustomerForm = true;
  }

  addNewCustomer(): void {
    if (this.newCustomer.firstName && this.newCustomer.lastName && this.newCustomer.mobile) {
      this.newCustomer.id = (this.existingCustomers.length + 1).toString();
      this.existingCustomers.push({ ...this.newCustomer });
      this.invoice.customer = { ...this.newCustomer };
      this.showAddCustomerForm = false;
      this.invoice.searchTerm = `${this.newCustomer.firstName} ${this.newCustomer.lastName} (${this.newCustomer.mobile})`;
      
      // Reset new customer form
      this.newCustomer = {
        id: '',
        prefix: 'Mr.',
        firstName: '',
        lastName: '',
        mobile: '',
        email: '',
        address: '',
        city: '',
        state: '',
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

  saveInvoice(): void {
    if (this.validateInvoice()) {
      // In real app, save to backend
      console.log('Invoice saved:', this.invoice);
      alert('Invoice created successfully!');
      this.router.navigate(['/dashboard']);
    }
  }

  validateInvoice(): boolean {
    if (!this.invoice.customer && this.invoice.customerType === 'existing') {
      alert('Please select a customer');
      return false;
    }

    if (this.invoice.customerType === 'new' && !this.newCustomer.firstName) {
      alert('Please add customer details');
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

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
