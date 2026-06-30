export interface ExtraFilter {
  key: string;
  value: string;
}

export interface SearchConfig {
  enabled?: boolean;
  name: string;
  keywords?: string;
  min_price?: number;
  max_price?: number;
  order_by?: string;
  latitude?: number;
  longitude?: number;
  distance_in_km?: number;
  condition?: string;
  category_id?: string;
  subcategory_ids?: string;
  extra_filters?: Record<string, string>;
  // UI ONLY
  ui_extra_filters?: ExtraFilter[];
}
