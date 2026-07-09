import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/data/auth.service';
import { SearchRepository } from '../../data/search.repository';
import { SearchConfig } from '../../domain/search-config.model';
import { SearchModalComponent } from '../components/search-modal/search-modal.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SearchModalComponent],
  template: `
    <div class="container">
      <div class="header">
        <h1 class="title">Wallapop Scraper Agent</h1>
        <div>
          <span *ngIf="userEmail" style="font-size: 0.875rem; color: var(--text-muted); margin-right: 1rem;">{{ userEmail }}</span>
          <button class="btn btn-ghost" (click)="logout()" style="margin-right: 0.5rem;">Salir</button>
          <button class="btn btn-primary" (click)="openNewSearch()">
            + Nueva Búsqueda
          </button>
        </div>
      </div>

      <div *ngIf="loading" style="text-align: center; padding: 3rem;">
        <p style="color: var(--text-muted)">Cargando configuración...</p>
      </div>

      <div *ngIf="!loading && searches.length === 0" style="text-align: center; padding: 3rem; background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border);">
        <p style="color: var(--text-muted); margin-bottom: 1rem;">No hay búsquedas configuradas.</p>
        <button class="btn btn-primary" (click)="openNewSearch()">Crear la primera</button>
      </div>

      <div class="grid grid-2 grid-3" *ngIf="!loading && searches.length > 0">
        <div class="glass-card" [ngStyle]="{'opacity': search.enabled !== false ? '1' : '0.6'}" *ngFor="let search of searches; let i = index">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; gap: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
              <label class="switch" style="margin-bottom: 0;" title="Habilitar/Deshabilitar filtro">
                <input type="checkbox" [checked]="search.enabled !== false" (change)="toggleFilterEnabled(i)">
                <span class="slider"></span>
              </label>
              <h3 style="font-size: 1.25rem; font-weight: 600; margin: 0;">{{ search.name }}</h3>
              <span *ngIf="search.enabled !== false" style="font-size: 0.75rem; padding: 0.15rem 0.5rem; background: rgba(16, 185, 129, 0.2); color: var(--success); border-radius: 4px; border: 1px solid var(--success);">Activo</span>
              <span *ngIf="search.enabled === false" style="font-size: 0.75rem; padding: 0.15rem 0.5rem; background: rgba(239, 68, 68, 0.2); color: var(--danger); border-radius: 4px; border: 1px solid var(--danger);">Deshabilitado</span>
            </div>
            <div style="display: flex; gap: 0.5rem; flex-shrink: 0;">
              <button class="btn btn-ghost" style="padding: 0.25rem 0.5rem;" (click)="editSearch(i)">Editar</button>
              <button class="btn btn-danger" style="padding: 0.25rem 0.5rem;" (click)="deleteSearch(i)">Borrar</button>
            </div>
          </div>
          
          <div style="color: var(--text-muted); font-size: 0.875rem;">
            <p *ngIf="search.keywords"><strong>Keywords:</strong> {{ search.keywords }}</p>
            <p *ngIf="search.min_price || search.max_price">
              <strong>Precio:</strong> 
              {{ search.min_price ? search.min_price + '€' : '0€' }} - {{ search.max_price ? search.max_price + '€' : '∞' }}
            </p>
            <p *ngIf="search.category_id"><strong>Categoría ID:</strong> {{ search.category_id }}</p>
            <p *ngIf="search.subcategory_ids"><strong>Subcategoría ID:</strong> {{ search.subcategory_ids }}</p>
            <p *ngIf="search.min_reviews !== undefined && search.min_reviews !== null"><strong>Valoraciones mínimas:</strong> {{ search.min_reviews }}</p>
          </div>
        </div>
      </div>
    </div>

    <app-search-modal
      *ngIf="isModalOpen"
      [search]="currentSearch"
      [isEditing]="currentIndex >= 0"
      [saving]="saving"
      (saveSearch)="saveCurrentSearch($event)"
      (close)="closeModal()"
    ></app-search-modal>
  `
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private searchRepo = inject(SearchRepository);
  
  userEmail = this.authService.currentUser?.email;
  
  searches: SearchConfig[] = [];
  loading = true;
  saving = false;
  
  isModalOpen = false;
  currentSearch: SearchConfig = { name: '', enabled: true, order_by: 'newest', ui_extra_filters: [] };
  currentIndex = -1;

  async ngOnInit() {
    await this.loadConfig();
  }

  async loadConfig() {
    try {
      this.searches = await this.searchRepo.getSearches();
    } catch (error: any) {
      console.error("Error loading config:", error);
      alert('Error al cargar datos desde Firebase: ' + (error.message || error));
    }
    this.loading = false;
  }

  async saveConfig(showAlert: boolean = true) {
    this.saving = true;
    try {
      await this.searchRepo.saveSearches(this.searches);
      if (showAlert) {
        alert('Configuración guardada exitosamente!');
      }
    } catch(err) {
      console.error(err);
      alert('Error al guardar en Firebase.');
    }
    this.saving = false;
  }

  async toggleFilterEnabled(index: number) {
    this.searches[index].enabled = !(this.searches[index].enabled !== false);
    await this.saveConfig(false);
  }

  openNewSearch() {
    this.currentSearch = { name: '', enabled: true, order_by: 'newest', ui_extra_filters: [] };
    this.currentIndex = -1;
    this.isModalOpen = true;
  }

  editSearch(index: number) {
    this.currentSearch = JSON.parse(JSON.stringify(this.searches[index]));
    if (this.currentSearch.enabled === undefined) {
      this.currentSearch.enabled = true;
    }
    if (!this.currentSearch.ui_extra_filters) {
      this.currentSearch.ui_extra_filters = [];
    }
    this.currentIndex = index;
    this.isModalOpen = true;
  }

  async deleteSearch(index: number) {
    if (confirm('¿Estás seguro de eliminar esta búsqueda?')) {
      this.searches.splice(index, 1);
      await this.saveConfig();
    }
  }

  closeModal() {
    this.isModalOpen = false;
  }

  async saveCurrentSearch(search: SearchConfig) {
    if (this.currentIndex >= 0) {
      this.searches[this.currentIndex] = search;
    } else {
      this.searches.push(search);
    }
    this.closeModal();
    await this.saveConfig();
  }

  async logout() {
    await this.authService.logout();
  }
}
