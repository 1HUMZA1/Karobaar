import { v4 as uuidv4 } from 'uuid';

/**
 * A simple LocalStorage based mock database service with async simulation
 * to mimic a real API interaction.
 */

const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

class DatabaseService {
  constructor() {
    this.prefix = 'ebusiness_';
  }

  // Get a raw collection (Unfiltered, for Internal Use like checking invites)
  async getRawCollection(collectionName) {
    await delay(100); // reduced delay for snappier feel
    const data = localStorage.getItem(`${this.prefix}${collectionName}`);
    return data ? JSON.parse(data) : [];
  }

  // Save a whole collection (Internal Use)
  async saveCollection(collectionName, data) {
    localStorage.setItem(`${this.prefix}${collectionName}`, JSON.stringify(data));
    return data;
  }

  // Get a collection filtered by businessId
  async getCollection(collectionName, businessId = null) {
    const data = await this.getRawCollection(collectionName);
    
    // For collections that span across or don't have businessId (like pure Users), return all
    // But we should enforce businessId for standard data.
    if (businessId && collectionName !== 'users') {
      return data.filter(item => item.businessId === businessId);
    }
    return data;
  }

  // Find a single item by ID
  async getById(collectionName, id, businessId = null) {
    const collection = await this.getCollection(collectionName, businessId);
    return collection.find(item => item.id === id) || null;
  }

  // Add a new item
  async add(collectionName, item, businessId = null) {
    const collection = await this.getRawCollection(collectionName);
    const newItem = { 
      ...item, 
      id: uuidv4(), 
      createdAt: new Date().toISOString() 
    };
    
    if (businessId && !newItem.businessId) {
      newItem.businessId = businessId;
    }
    
    collection.push(newItem);
    await this.saveCollection(collectionName, collection);
    return newItem;
  }

  // Update an existing item
  async update(collectionName, id, updates, businessId = null) {
    const collection = await this.getRawCollection(collectionName);
    const index = collection.findIndex(item => item.id === id);
    if (index === -1) throw new Error(`Item ${id} not found in ${collectionName}`);
    
    // Enforce business isolation
    if (businessId && collection[index].businessId && collection[index].businessId !== businessId) {
       throw new Error(`Unauthorized update on item ${id} outside of business ${businessId}`);
    }
    
    collection[index] = { ...collection[index], ...updates, updatedAt: new Date().toISOString() };
    await this.saveCollection(collectionName, collection);
    return collection[index];
  }

  // Delete an item
  async delete(collectionName, id, businessId = null) {
    const collection = await this.getRawCollection(collectionName);
    
    const index = collection.findIndex(item => item.id === id);
    if (index === -1) return true; // Already gone

    if (businessId && collection[index].businessId && collection[index].businessId !== businessId) {
      throw new Error(`Unauthorized delete on item ${id} outside of business ${businessId}`);
    }

    const filtered = collection.filter(item => item.id !== id);
    await this.saveCollection(collectionName, filtered);
    return true;
  }
}

export const db = new DatabaseService();
