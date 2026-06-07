import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { SearchConfig, ExtraFilter } from '../domain/search-config.model';

@Injectable({
  providedIn: 'root'
})
export class SearchRepository {
  private firestore = inject(Firestore);
  private docPath = 'wallapop-agent/config';

  async getSearches(): Promise<SearchConfig[]> {
    const docRef = doc(this.firestore, this.docPath);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
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
          category_id,
          subcategory_ids,
          ui_extra_filters
        };
      });
    }
    return [];
  }

  async saveSearches(searches: SearchConfig[]): Promise<void> {
    const docRef = doc(this.firestore, this.docPath);
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
      const cleanS = { ...s, extra_filters };
      delete cleanS.ui_extra_filters;
      delete cleanS.category_id;
      delete cleanS.subcategory_ids;
      return cleanS;
    });
    
    await setDoc(docRef, { searches: payload }, { merge: true });
  }
}
