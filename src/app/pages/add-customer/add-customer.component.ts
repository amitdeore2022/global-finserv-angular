import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CustomerService, Customer } from '../../services/customer.service';

@Component({
  selector: 'app-add-customer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-customer.component.html',
  styleUrls: ['./add-customer.component.css']
})
export class AddCustomerComponent {
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

  prefixOptions = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'];
  countryCodeOptions = [
    { code: '+91', country: 'India' },
    { code: '+1', country: 'USA' },
    { code: '+44', country: 'UK' },
    { code: '+86', country: 'China' },
    { code: '+81', country: 'Japan' },
    { code: '+49', country: 'Germany' },
    { code: '+33', country: 'France' },
    { code: '+61', country: 'Australia' },
    { code: '+971', country: 'UAE' }
  ];

  constructor(
    private router: Router,
    private customerService: CustomerService
  ) {}

  async addCustomer() {
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
        
        const customerData: Omit<Customer, 'id'> = {
          name: fullName,
          mobile: fullMobile,
          gst: this.newCustomer.gst || '', // Optional field
          email: this.newCustomer.email || '', // Optional field
          address: fullAddress,
          dueAmount: 0
        };
        
        // Save customer to Firestore
        console.log('💾 Saving customer to Firestore:', customerData);
        const customerId = await this.customerService.addCustomer(customerData);
        console.log('✅ Customer saved successfully with ID:', customerId);
        
        // Show success message
        alert('Customer added successfully!');
        
        // Reset form
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
        
        // Navigate back to dashboard
        this.router.navigate(['/dashboard']);
      } catch (error) {
        console.error('❌ Error adding customer:', error);
        alert('Error adding customer. Please try again.');
      }
    } else {
      alert('Please fill in all mandatory fields');
    }
  }

  goBack() {
    this.router.navigate(['/dashboard'], { queryParams: { category: 'customers' } });
  }
}
