import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AddCustomerComponent } from './pages/add-customer/add-customer.component';
import { ViewCustomerComponent } from './pages/view-customer/view-customer.component';
import { CreateInvoiceComponent } from './pages/create-invoice/create-invoice.component';
import { ViewInvoicesComponent } from './pages/view-invoices/view-invoices.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'add-customer', component: AddCustomerComponent },
  { path: 'view-customer', component: ViewCustomerComponent },
  { path: 'create-invoice', component: CreateInvoiceComponent },
  { path: 'view-invoices', component: ViewInvoicesComponent },
];