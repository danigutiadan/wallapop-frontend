import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { SearchConfig, ExtraFilter } from '../domain/search-config.model';
import { AuthService } from '../../auth/data/auth.service';

@Injectable({
  providedIn: 'root'
})
export class SearchRepository {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  private mapSearches(data: any): SearchConfig[] {
    return (data['searches'] || []).map((s: any) => {
      const ui_extra_filters: ExtraFilter[] = [];
      let category_id = s.category_id;
      let subcategory_ids = s.subcategory_ids;

      if (s.extra_filters) {
        for (const key of Object.keys(s.extra_filters)) {
          if (key === 'category_id') {
            category_id = s.extra_filters[key];
          } else if (key === 'subcategory_ids') {
            subcategory_ids = s.extra_filters[key];
          } else {
            ui_extra_filters.push({ key, value: s.extra_filters[key] });
          }
        }
      }

      return {
        ...s,
        enabled: s.enabled !== undefined ? s.enabled : true,
        category_id,
        subcategory_ids,
        ui_extra_filters
      };
    });
  }

  async getSearches(): Promise<SearchConfig[]> {
    const user = this.authService.currentUser;
    if (!user) {
      return [];
    }

    const docRef = doc(this.firestore, `users/${user.uid}`);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return this.mapSearches(docSnap.data());
    }

    // Fallback: If document doesn't exist and it's the admin/original user, check legacy config
    if (user.email === 'danigutiadan4@gmail.com' || user.uid === 'CoZSISpMSdMZZCUUlud7nmo7kS12') {
      const legacyDocRef = doc(this.firestore, 'wallapop-agent/config');
      const legacyDocSnap = await getDoc(legacyDocRef);
      if (legacyDocSnap.exists()) {
        return this.mapSearches(legacyDocSnap.data());
      }
    }

    return [];
  }

  async saveSearches(searches: SearchConfig[]): Promise<void> {
    const user = this.authService.currentUser;
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const payload = searches.map(s => {
      const extra_filters: Record<string, string> = {};

      // Add category_id and subcategory_ids as the first extra filters
      if (s.category_id) {
        extra_filters['category_id'] = s.category_id;
      }
      if (s.subcategory_ids) {
        extra_filters['subcategory_ids'] = s.subcategory_ids;
      }

      if (s.ui_extra_filters) {
        for (const filter of s.ui_extra_filters) {
          if (filter.key && filter.value) {
            extra_filters[filter.key] = filter.value;
          }
        }
      }
      const cleanS = {
        ...s,
        enabled: s.enabled !== undefined ? s.enabled : true,
        extra_filters
      };
      delete cleanS.ui_extra_filters;
      delete cleanS.category_id;
      delete cleanS.subcategory_ids;
      if (cleanS.min_reviews === null || cleanS.min_reviews === undefined || (cleanS.min_reviews as any) === '') {
        delete cleanS.min_reviews;
      } else {
        cleanS.min_reviews = Number(cleanS.min_reviews);
      }
      return cleanS;
    });

    const docRef = doc(this.firestore, `users/${user.uid}`);
    await setDoc(docRef, {
      email: user.email,
      searches: payload
    }, { merge: true });
  }
}
