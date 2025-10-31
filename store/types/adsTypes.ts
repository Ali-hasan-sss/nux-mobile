export interface Ad {
  id: number;
  title: string;
  description: string;
  image: string | null;
  category: string;
  createdAt: string;
  restaurant: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    logo: string | null;
    address: string;
  };
}

export interface AdsPagination {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface AdsResponse {
  success: boolean;
  message: string;
  data: {
    pagination: AdsPagination;
    ads: Ad[];
  };
}

export interface AdsFilters {
  search?: string;
  category?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  page?: number;
  pageSize?: number;
}

export interface AdsState {
  ads: Ad[];
  pagination: AdsPagination | null;
  filters: AdsFilters;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
}
