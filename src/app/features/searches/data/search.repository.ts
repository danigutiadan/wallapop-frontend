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
        if (s.extra_filters) {
          for (const key of Object.keys(s.extra_filters)) {
            ui_extra_filters.push({ key, value: s.extra_filters[key] });
          }
        }
        return { ...s, ui_extra_filters };
      });
    }
    return [];
  }

  async saveSearches(searches: SearchConfig[]): Promise<void> {
    const docRef = doc(this.firestore, this.docPath);
    const payload = searches.map(s => {
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
  }
}
