export type PantryItem = {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  expiry_date: string | null;
  location: 'pantry' | 'fridge' | 'freezer' | 'other' | null;
  created_at: string | null;
  updated_at: string | null;
  added_by?: string | null;
  brand?: string | null;
  category?: string | null;
  image_url?: string | null;
  is_favorite?: boolean | null;
  metadata?: any | null;
  status?: 'fresh' | 'expiring' | 'expired' | 'consumed' | 'wasted' | null;
  household_id?: string | null;
};