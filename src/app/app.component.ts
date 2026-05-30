import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from './features/auth/data/auth.service';
import { LoginComponent } from './features/auth/presentation/login/login.component';
import { DashboardComponent } from './features/searches/presentation/dashboard/dashboard.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, LoginComponent, DashboardComponent],
  template: `
    <ng-container *ngIf="authService.authChecked$ | async as authChecked">
      
      <!-- Show Login if not authenticated -->
      <app-login *ngIf="authChecked && !(authService.user$ | async)"></app-login>
      
      <!-- Show Dashboard if authenticated -->
      <app-dashboard *ngIf="authChecked && (authService.user$ | async)"></app-dashboard>
      
    </ng-container>
  `
})
export class AppComponent {
  authService = inject(AuthService);
}
