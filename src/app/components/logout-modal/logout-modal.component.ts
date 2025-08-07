import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logout-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="isVisible" (click)="onCancel()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="logout-icon">
            <i class="fas fa-sign-out-alt"></i>
          </div>
          <h3>Confirm Logout</h3>
          <button class="close-btn" (click)="onCancel()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <p>Are you sure you want to logout?</p>
          <p class="sub-text">You will be redirected to the login page.</p>
        </div>
        
        <div class="modal-actions">
          <button class="cancel-btn" (click)="onCancel()">
            <i class="fas fa-times"></i>
            Cancel
          </button>
          <button class="confirm-btn" (click)="onConfirm()">
            <i class="fas fa-sign-out-alt"></i>
            Logout
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./logout-modal.component.css']
})
export class LogoutModalComponent {
  @Input() isVisible = false;
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
