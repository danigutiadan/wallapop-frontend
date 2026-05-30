import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../data/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container" style="display: flex; justify-content: center; align-items: center; min-height: 80vh;">
      <div class="glass-card" style="width: 100%; max-width: 400px;">
        <h2 style="font-size: 1.5rem; margin-bottom: 1.5rem; text-align: center; font-weight: 600;">Iniciar Sesión</h2>
        
        <div class="form-group">
          <label>Email</label>
          <input type="email" [(ngModel)]="email" placeholder="admin@wallapop.com">
        </div>
        
        <div class="form-group">
          <label>Contraseña</label>
          <input type="password" [(ngModel)]="password" (keyup.enter)="login()" placeholder="••••••••">
        </div>

        <div *ngIf="error" style="color: var(--danger); font-size: 0.875rem; margin-bottom: 1rem; text-align: center;">
          {{ error }}
        </div>
        
        <button class="btn btn-primary" style="width: 100%; padding: 0.75rem;" (click)="login()" [disabled]="loading">
          {{ loading ? 'Cargando...' : 'Acceder' }}
        </button>
      </div>
    </div>
  `
})
export class LoginComponent {
  private authService = inject(AuthService);
  
  email = '';
  password = '';
  error = '';
  loading = false;

  async login() {
    if (!this.email || !this.password) return;
    this.error = '';
    this.loading = true;
    try {
      await this.authService.login(this.email, this.password);
    } catch (err: any) {
      this.error = 'Credenciales incorrectas o usuario no encontrado.';
      console.error(err);
    }
    this.loading = false;
  }
}
