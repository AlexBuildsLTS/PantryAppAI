export interface PantryItem {
  id?: number;
  name: string;
  quantity: number;
  unit: string;
  location: string;
  expiryDate: string;
  createdAt: string;
  updatedAt: string;
}

export type LocationType = 'Pantry' | 'Fridge' | 'Freezer';
export type UnitType = 'pcs' | 'g' | 'kg' | 'ml' | 'L' | 'cups' | 'tbsp' | 'tsp';