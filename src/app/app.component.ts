import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { Auth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from '@angular/fire/auth';

interface ExtraFilter {
  key: string;
  value: string;
}

interface SearchConfig {
  name: string;
  keywords?: string;
  min_price?: number;
  max_price?: number;
  order_by?: string;
  latitude?: number;
  longitude?: number;
  distance_in_km?: number;
  condition?: string;
  category_ids?: string;
  object_type_id?: string;
  extra_filters?: Record<string, string>;
  // UI ONLY
  ui_extra_filters?: ExtraFilter[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  
  user: User | null = null;
  authChecked = false;
  loginEmail = '';
  loginPassword = '';
  loginError = '';
  
  searches: SearchConfig[] = [];
  loading = true;
  saving = false;
  
  isModalOpen = false;
  currentSearch: SearchConfig = { name: '', ui_extra_filters: [] };
  currentIndex = -1;

  async ngOnInit() {
    onAuthStateChanged(this.auth, async (user) => {
      this.user = user;
      this.authChecked = true;
      if (user) {
        await this.loadConfig();
      }
    });
  }

  async login() {
    this.loginError = '';
    try {
      await signInWithEmailAndPassword(this.auth, this.loginEmail, this.loginPassword);
    } catch (err: any) {
      this.loginError = 'Credenciales incorrectas o usuario no encontrado.';
      console.error(err);
    }
  }

  async logout() {
    await signOut(this.auth);
    this.searches = [];
  }

  async loadConfig() {
    try {
      const docRef = doc(this.firestore, 'wallapop-agent/config');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        this.searches = (data['searches'] || []).map((s: any) => {
            const ui_extra_filters: ExtraFilter[] = [];
            if (s.extra_filters) {
                for (const key of Object.keys(s.extra_filters)) {
                    ui_extra_filters.push({ key, value: s.extra_filters[key] });
                }
            }
            return { ...s, ui_extra_filters };
        });
      } else {
        console.warn("El documento config no existe todavía en Firebase.");
      }
    } catch (error: any) {
      console.error("Error loading config:", error);
      alert('Error al cargar datos desde Firebase: ' + (error.message || error));
    }
    this.loading = false;
  }

  async saveConfig() {
    this.saving = true;
    try {
        const docRef = doc(this.firestore, 'wallapop-agent/config');
        const payload = this.searches.map(s => {
            const extra_filters: Record<string, string> = {};
            if (s.ui_extra_filters) {
                for (const filter of s.ui_extra_filters) {
                    if (filter.key && filter.value) {
                        extra_filters[filter.key] = filter.value;
                    }
                }
            }
            const cleanS = { ...s, extra_filters };
            delete cleanS.ui_extra_filters;
            return cleanS;
        });
        await setDoc(docRef, { searches: payload }, { merge: true });
        alert('Configuración guardada en Firebase exitosamente!');
    } catch(err) {
        console.error(err);
        alert('Error al guardar. ¿Has configurado los datos de Firebase en src/environments/environment.ts?');
    }
    this.saving = false;
  }

  openNewSearch() {
    this.currentSearch = { name: '', ui_extra_filters: [] };
    this.currentIndex = -1;
    this.isModalOpen = true;
  }

  editSearch(index: number) {
    this.currentSearch = JSON.parse(JSON.stringify(this.searches[index]));
    if (!this.currentSearch.ui_extra_filters) {
        this.currentSearch.ui_extra_filters = [];
    }
    this.currentIndex = index;
    this.isModalOpen = true;
  }

  deleteSearch(index: number) {
    if (confirm('¿Estás seguro de eliminar esta búsqueda?')) {
        this.searches.splice(index, 1);
        this.saveConfig();
    }
  }

  closeModal() {
    this.isModalOpen = false;
  }

  saveCurrentSearch() {
    if (!this.currentSearch.name) {
        alert('El nombre es obligatorio');
        return;
    }
    if (this.currentIndex >= 0) {
        this.searches[this.currentIndex] = this.currentSearch;
    } else {
        this.searches.push(this.currentSearch);
    }
    this.closeModal();
    this.saveConfig();
  }
  
  addExtraFilter() {
      if (!this.currentSearch.ui_extra_filters) {
          this.currentSearch.ui_extra_filters = [];
      }
      this.currentSearch.ui_extra_filters.push({ key: '', value: '' });
  }
  
  removeExtraFilter(index: number) {
      this.currentSearch.ui_extra_filters?.splice(index, 1);
  }
  
  presetMotorFilters() {
      this.addSpecificFilter('brand', '');
      this.addSpecificFilter('model', '');
      this.addSpecificFilter('year', '');
      this.addSpecificFilter('km', '');
  }
  
  presetInmobiliariaFilters() {
      this.addSpecificFilter('rooms', '');
      this.addSpecificFilter('bathrooms', '');
      this.addSpecificFilter('surface', '');
  }
  
  private addSpecificFilter(key: string, value: string) {
      if (!this.currentSearch.ui_extra_filters) {
          this.currentSearch.ui_extra_filters = [];
      }
      if (!this.currentSearch.ui_extra_filters.some(f => f.key === key)) {
          this.currentSearch.ui_extra_filters.push({ key, value });
      }
  }
}
