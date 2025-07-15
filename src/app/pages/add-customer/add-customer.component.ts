import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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

  constructor(private router: Router) {}

  addCustomer() {
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
      const fullMobile = `${this.newCustomer.countryCode} ${this.newCustomer.mobile}`;
      const fullAddress = `${this.newCustomer.addressLine1}, ${this.newCustomer.village}${this.newCustomer.taluka ? ', ' + this.newCustomer.taluka : ''}, ${this.newCustomer.district}${this.newCustomer.pinCode ? ', ' + this.newCustomer.pinCode : ''}`;
      
      const customerData = {
        name: fullName,
        mobile: fullMobile,
        gst: this.newCustomer.gst || '', // Optional field
        email: this.newCustomer.email || '', // Optional field
        address: fullAddress
      };
      
      // Here you can add logic to save the customer to a service or database
      console.log('Customer added:', customerData);
      
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
    } else {
      alert('Please fill in all mandatory fields');
    }
  }

  goBack() {
    this.router.navigate(['/dashboard'], { queryParams: { category: 'customers' } });
  }
}
