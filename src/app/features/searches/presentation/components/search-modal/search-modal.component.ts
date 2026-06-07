import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchConfig } from '../../../domain/search-config.model';
import categoriesData from '../../../domain/categories.json';
import categoryAttributesData from '../../../domain/category-attributes.json';

@Component({
  selector: 'app-search-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay">
      <div class="glass-card modal-content">
        <h2 style="font-size: 1.5rem; margin-bottom: 1.5rem; font-weight: 600;">
          {{ isEditing ? 'Editar Búsqueda' : 'Nueva Búsqueda' }}
        </h2>
        
        <div class="form-group">
          <label>Nombre Identificativo *</label>
          <input type="text" [(ngModel)]="search.name" placeholder="Ej: Coches baratos Madrid">
        </div>

        <div class="grid grid-2">
          <div class="form-group">
            <label>Palabras Clave (Keywords)</label>
            <input type="text" [(ngModel)]="search.keywords" placeholder="Ej: audi a3">
          </div>
          
          <div class="form-group">
            <label>Orden</label>
            <select [(ngModel)]="search.order_by">
              <option value="">Por defecto</option>
              <option value="newest">Más recientes</option>
              <option value="price_low_to_high">Precio: de menor a mayor</option>
              <option value="price_high_to_low">Precio: de mayor a menor</option>
            </select>
          </div>
        </div>

        <div class="grid grid-2">
          <div class="form-group">
            <label>Precio Mínimo (€)</label>
            <input type="number" [(ngModel)]="search.min_price" placeholder="Ej: 50">
          </div>
          <div class="form-group">
            <label>Precio Máximo (€)</label>
            <input type="number" [(ngModel)]="search.max_price" placeholder="Ej: 500">
          </div>
        </div>
        
        <div class="grid grid-2">
          <div class="form-group">
            <label>Condición (Estado)</label>
            <select [(ngModel)]="search.condition">
              <option value="">Cualquiera</option>
              <option value="new">Nuevo</option>
              <option value="as_good_as_new">Como nuevo</option>
              <option value="good">En buen estado</option>
              <option value="fair">En condiciones aceptables</option>
              <option value="has_given_it_all">Lo ha dado todo</option>
            </select>
          </div>
          <div class="form-group">
            <label>Categoría</label>
            <select [(ngModel)]="search.category_id" (ngModelChange)="onCategoryChange()">
              <option value="">Todas las categorías</option>
              <option *ngFor="let cat of categories" [value]="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>
        </div>

        <div class="grid grid-2" *ngIf="subcategories.length > 0">
          <div class="form-group">
            <label>Subcategoría</label>
            <select [(ngModel)]="search.subcategory_ids" (ngModelChange)="onSubcategoryChange()">
              <option value="">Cualquiera</option>
              <option *ngFor="let sub of subcategories" [value]="sub.id">
                {{ sub.name }}
              </option>
            </select>
          </div>
        </div>
        
        <hr style="border: 0; border-top: 1px solid var(--border); margin: 2rem 0;">
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h3 style="font-size: 1.1rem; font-weight: 600;">Filtros Específicos Avanzados</h3>
          <button class="btn btn-ghost" (click)="addExtraFilter()">+ Añadir Filtro</button>
        </div>
        <p style="color: var(--text-muted); font-size: 0.8rem; margin-bottom: 1rem;">
          Aquí puedes añadir cualquier filtro extra de la URL de Wallapop (ej. brand=audi, model=a3, year=2015).
        </p>
        
        <div *ngFor="let filter of search.ui_extra_filters; let i = index" class="flex-gap" style="margin-bottom: 0.5rem;">
          <select *ngIf="availableAttributes.length > 0" [(ngModel)]="filter.key" (ngModelChange)="onFilterKeyChange(filter)">
            <option value="" disabled>Selecciona un filtro</option>
            <option *ngFor="let attr of availableAttributes" [value]="attr">
              {{ attributeTranslations[attr] || attr }}
            </option>
          </select>
          <input *ngIf="availableAttributes.length === 0" type="text" [(ngModel)]="filter.key" placeholder="Parámetro (ej. brand)">

          <ng-container *ngIf="filterDropdowns[filter.key]; else textInput">
            <select [(ngModel)]="filter.value">
              <option value="" disabled>Selecciona un valor</option>
              <option *ngFor="let option of filterDropdowns[filter.key]" [value]="option.value">
                {{ option.label }}
              </option>
            </select>
          </ng-container>
          <ng-template #textInput>
            <input type="text" [(ngModel)]="filter.value" placeholder="Valor (ej. BMW)">
          </ng-template>

          <button class="btn btn-danger" (click)="removeExtraFilter(i)">X</button>
        </div>
        
        <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem;">
          <button class="btn btn-ghost" (click)="close.emit()">Cancelar</button>
          <button class="btn btn-primary" (click)="save()" [disabled]="saving">
            {{ saving ? 'Guardando...' : 'Guardar Búsqueda' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class SearchModalComponent {
  @Input() search!: SearchConfig;
  @Input() isEditing = false;
  @Input() saving = false;

  attributeTranslations: Record<string, string> = {
    "brand": "Marca",
    "model": "Modelo",
    "version": "Versión",
    "color": "Color",
    "warranty": "Garantía",
    "license_plate": "Matrícula",
    "year": "Año",
    "seats": "Plazas",
    "doors": "Puertas",
    "km": "Kilómetros",
    "horse_power": "Caballos",
    "financed_price": "Precio financiado",
    "engine_displacement": "Cilindrada",
    "subcategory": "Subcategoría",
    "subcategory_lv2": "Subcategoría (Nivel 2)",
    "size": "Talla",
    "operation": "Operación",
    "type": "Tipo",
    "location": "Ubicación",
    "condition": "Condición",
    "surface": "Superficie",
    "rooms": "Habitaciones",
    "bathrooms": "Baños",
    "garage": "Garaje",
    "terrace": "Terraza",
    "elevator": "Ascensor",
    "pool": "Piscina",
    "garden": "Jardín",
    "description": "Descripción",
    "is_refurbished": "Reacondicionado",
    "storage_capacity": "Capacidad de almacenamiento",
    "height_cm": "Alto (cm)",
    "width_cm": "Ancho (cm)",
    "length_cm": "Largo (cm)",
    "isbn": "ISBN",
    "author": "Autor",
    "publisher": "Editorial",
    "language": "Idioma",
    "book_format": "Formato del libro",
    "is_pack": "Es pack",
    "excluded": "Excluido"
  };

  filterDropdowns: Record<string, {value: string, label: string}[]> = {
    "operation": [
      { value: "sale", label: "Venta" },
      { value: "rent", label: "Alquiler" }
    ],
    "type": [
      { value: "apartment", label: "Piso" },
      { value: "house", label: "Casa/Chalet" },
      { value: "room", label: "Habitación" },
      { value: "garage", label: "Garaje" },
      { value: "office", label: "Oficina" },
      { value: "land", label: "Terreno" },
      { value: "storage", label: "Trastero" }
    ],
    "rooms": [
      { value: "1", label: "1" },
      { value: "2", label: "2" },
      { value: "3", label: "3" },
      { value: "4", label: "4 o más" }
    ],
    "bathrooms": [
      { value: "1", label: "1" },
      { value: "2", label: "2" },
      { value: "3", label: "3 o más" }
    ],
    "garage": [
      { value: "true", label: "Sí" }
    ],
    "terrace": [
      { value: "true", label: "Sí" }
    ],
    "elevator": [
      { value: "true", label: "Sí" }
    ],
    "pool": [
      { value: "true", label: "Sí" }
    ],
    "garden": [
      { value: "true", label: "Sí" }
    ]
  };
  
  @Output() saveSearch = new EventEmitter<SearchConfig>();
  @Output() close = new EventEmitter<void>();

  categories = categoriesData;
  subcategories: {id: number, name: string}[] = [];
  availableAttributes: string[] = [];

  ngOnInit() {
    this.updateSubcategories();
    this.updateAvailableAttributes();
  }

  onCategoryChange() {
    this.search.subcategory_ids = ''; // Reset subcategory when category changes
    this.updateSubcategories();
    this.updateAvailableAttributes();
  }

  onSubcategoryChange() {
    this.updateAvailableAttributes();
  }

  updateSubcategories() {
    if (!this.search.category_id) {
      this.subcategories = [];
      return;
    }
    const selectedCat = this.categories.find(c => c.id.toString() === this.search.category_id?.toString());
    this.subcategories = selectedCat?.subcategories || [];
  }

  updateAvailableAttributes() {
    const activeId = this.search.subcategory_ids || this.search.category_id;
    if (activeId) {
      this.availableAttributes = (categoryAttributesData as any)[activeId.toString()] || [];
    } else {
      this.availableAttributes = [];
    }
  }

  addExtraFilter() {
    if (!this.search.ui_extra_filters) {
      this.search.ui_extra_filters = [];
    }
    this.search.ui_extra_filters.push({ key: '', value: '' });
  }

  onFilterKeyChange(filter: any) {
    filter.value = '';
  }

  removeExtraFilter(index: number) {
    this.search.ui_extra_filters?.splice(index, 1);
  }

  save() {
    if (!this.search.name) {
      alert('El nombre es obligatorio');
      return;
    }
    this.saveSearch.emit(this.search);
  }
}
