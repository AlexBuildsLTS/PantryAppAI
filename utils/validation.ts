import { PantryItem } from '@/types/PantryItem';

export const validatePantryItem = (item: Partial<PantryItem>): string[] => {
  const errors: string[] = [];
  
  if (!item.name?.trim()) {
    errors.push('Item name is required');
  }
  
  if (!item.quantity || item.quantity <= 0) {
    errors.push('Quantity must be greater than 0');
  }
  
  if (!item.unit?.trim()) {
    errors.push('Unit is required');
  }
  
  if (!item.location?.trim()) {
    errors.push('Location is required');
  }
  
  if (!item.expiryDate) {
    errors.push('Expiry date is required');
  } else {
    const expiryDate = new Date(item.expiryDate);
    if (isNaN(expiryDate.getTime())) {
      errors.push('Invalid expiry date');
    }
  }
  
  return errors;
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};