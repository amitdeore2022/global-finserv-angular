import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-view-customer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-customer.component.html',
  styleUrls: ['./view-customer.component.css']
})
export class ViewCustomerComponent {
  customers = [
    {
      id: 1,
      name: 'Mr. John Doe',
      mobile: '+91 9876543210',
      gst: 'GST123456789',
      email: 'john.doe@email.com',
      address: '123 Main Street, Village Name, Taluka Name, District Name, 123456',
      dueAmount: 5000
    },
    {
      id: 2,
      name: 'Mrs. Jane Smith',
      mobile: '+91 8765432109',
      gst: 'GST987654321',
      email: 'jane.smith@email.com',
      address: '456 Oak Avenue, Another Village, Another Taluka, Another District, 654321',
      dueAmount: 0
    },
    {
      id: 3,
      name: 'Dr. Robert Johnson',
      mobile: '+1 5551234567',
      gst: '',
      email: '',
      address: '789 Pine Road, Some Village, Some Taluka, Some District, 789012',
      dueAmount: 2500
    }
  ];

  constructor(private router: Router) {}

  get totalDueAmount(): number {
    return this.customers.reduce((sum, customer) => sum + customer.dueAmount, 0);
  }

  goBack() {
    this.router.navigate(['/dashboard'], { queryParams: { category: 'customers' } });
  }

  editCustomer(customerId: number) {
    // Future implementation for editing customer
    console.log('Edit customer:', customerId);
  }

  deleteCustomer(customerId: number) {
    // Future implementation for deleting customer
    if (confirm('Are you sure you want to delete this customer?')) {
      this.customers = this.customers.filter(customer => customer.id !== customerId);
      console.log('Customer deleted:', customerId);
    }
  }
}
