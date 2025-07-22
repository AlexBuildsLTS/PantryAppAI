import * as SQLite from 'expo-sqlite';
import { PantryItem } from '@/types/PantryItem';
import { AppError, logError } from '@/utils/errorHandler';

class PantryDatabaseClass {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;

  async init(): Promise<SQLite.SQLiteDatabase> {
    if (this.db && this.isInitialized) {
      return this.db;
    }

    try {
      this.db = await SQLite.openDatabaseAsync('pantrypal.db');
      await this.createTables();
      this.isInitialized = true;
      return this.db;
    } catch (error) {
      logError(error, 'Database initialization');
      throw new AppError('Failed to initialize database');
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new AppError('Database not initialized');

    try {
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS pantry_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL CHECK(length(name) > 0),
          quantity REAL NOT NULL CHECK(quantity > 0),
          unit TEXT NOT NULL CHECK(length(unit) > 0),
          location TEXT NOT NULL CHECK(length(location) > 0),
          expiryDate TEXT NOT NULL,
          createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_pantry_items_expiry ON pantry_items(expiryDate);
        CREATE INDEX IF NOT EXISTS idx_pantry_items_location ON pantry_items(location);
        CREATE INDEX IF NOT EXISTS idx_pantry_items_name ON pantry_items(name);
      `);
    } catch (error) {
      logError(error, 'Table creation');
      throw new AppError('Failed to create database tables');
    }
  }

  async addItem(item: Omit<PantryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    try {
      const db = await this.init();
      const now = new Date().toISOString();
      
      const result = await db.runAsync(
        `INSERT INTO pantry_items (name, quantity, unit, location, expiryDate, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [item.name, item.quantity, item.unit, item.location, item.expiryDate, now, now]
      );
      
      if (!result.lastInsertRowId) {
        throw new AppError('Failed to insert item');
      }
      
      return result.lastInsertRowId;
    } catch (error) {
      logError(error, 'Adding pantry item');
      throw new AppError('Failed to add item to pantry');
    }
  }

  async updateItem(id: number, item: Omit<PantryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const db = await this.init();
      const now = new Date().toISOString();
      
      const result = await db.runAsync(
        `UPDATE pantry_items 
         SET name = ?, quantity = ?, unit = ?, location = ?, expiryDate = ?, updatedAt = ?
         WHERE id = ?`,
        [item.name, item.quantity, item.unit, item.location, item.expiryDate, now, id]
      );
      
      if (result.changes === 0) {
        throw new AppError('Item not found');
      }
    } catch (error) {
      logError(error, 'Updating pantry item');
      throw new AppError('Failed to update item');
    }
  }

  async deleteItem(id: number): Promise<void> {
    try {
      const db = await this.init();
      const result = await db.runAsync('DELETE FROM pantry_items WHERE id = ?', [id]);
      
      if (result.changes === 0) {
        throw new AppError('Item not found');
      }
    } catch (error) {
      logError(error, 'Deleting pantry item');
      throw new AppError('Failed to delete item');
    }
  }

  async getAllItems(): Promise<PantryItem[]> {
    try {
      const db = await this.init();
      const result = await db.getAllAsync('SELECT * FROM pantry_items ORDER BY expiryDate ASC');
      return result as PantryItem[];
    } catch (error) {
      logError(error, 'Getting all pantry items');
      throw new AppError('Failed to load pantry items');
    }
  }

  async getItemsByLocation(location: string): Promise<PantryItem[]> {
    try {
      const db = await this.init();
      const result = await db.getAllAsync(
        'SELECT * FROM pantry_items WHERE location = ? ORDER BY expiryDate ASC',
        [location]
      );
      return result as PantryItem[];
    } catch (error) {
      logError(error, 'Getting items by location');
      throw new AppError('Failed to load items by location');
    }
  }

  async getExpiringItems(days: number = 3): Promise<PantryItem[]> {
    try {
      const db = await this.init();
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      
      const result = await db.getAllAsync(
        'SELECT * FROM pantry_items WHERE expiryDate <= ? ORDER BY expiryDate ASC',
        [targetDate.toISOString()]
      );
      return result as PantryItem[];
    } catch (error) {
      logError(error, 'Getting expiring items');
      throw new AppError('Failed to load expiring items');
    }
  }

  async searchItems(query: string): Promise<PantryItem[]> {
    try {
      const db = await this.init();
      const result = await db.getAllAsync(
        'SELECT * FROM pantry_items WHERE name LIKE ? ORDER BY name ASC',
        [`%${query}%`]
      );
      return result as PantryItem[];
    } catch (error) {
      logError(error, 'Searching items');
      throw new AppError('Failed to search items');
    }
  }

  async getItemCount(): Promise<number> {
    try {
      const db = await this.init();
      const result = await db.getFirstAsync('SELECT COUNT(*) as count FROM pantry_items') as { count: number };
      return result.count;
    } catch (error) {
      logError(error, 'Getting item count');
      return 0;
    }
  }
}

export const PantryDatabase = new PantryDatabaseClass();