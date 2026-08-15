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

  // Get a whole collection
  async getCollection(collectionName) {
    await delay();
    const data = localStorage.getItem(`${this.prefix}${collectionName}`);
    return data ? JSON.parse(data) : [];
  }

  // Save a whole collection
  async saveCollection(collectionName, data) {
    await delay();
    localStorage.setItem(`${this.prefix}${collectionName}`, JSON.stringify(data));
    return data;
  }

  // Find a single item by ID
  async getById(collectionName, id) {
    const collection = await this.getCollection(collectionName);
    return collection.find(item => item.id === id) || null;
  }

  // Add a new item
  async add(collectionName, item) {
    const collection = await this.getCollection(collectionName);
    const newItem = { ...item, id: uuidv4(), createdAt: new Date().toISOString() };
    collection.push(newItem);
    await this.saveCollection(collectionName, collection);
    return newItem;
  }

  // Update an existing item
  async update(collectionName, id, updates) {
    const collection = await this.getCollection(collectionName);
    const index = collection.findIndex(item => item.id === id);
    if (index === -1) throw new Error(`Item ${id} not found in ${collectionName}`);
    
    collection[index] = { ...collection[index], ...updates, updatedAt: new Date().toISOString() };
    await this.saveCollection(collectionName, collection);
    return collection[index];
  }

  // Delete an item
  async delete(collectionName, id) {
    const collection = await this.getCollection(collectionName);
    const filtered = collection.filter(item => item.id !== id);
    await this.saveCollection(collectionName, filtered);
    return true;
  }
}

export const db = new DatabaseService();
