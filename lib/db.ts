// Browser-compatible database utility using IndexedDB with Supabase sync
import { v4 as uuidv4 } from "uuid"
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase"

// Track pending changes for sync
let pendingChanges: SyncData[] = []
let isInitialized = false
let syncLock: Promise<SyncResult> | null = null;

// Database structure
interface Record {
  id: string
  [key: string]: any
}

interface DatabaseStore {
  [table: string]: Record[]
}

// Define interfaces
interface SyncData {
  table: string;
  id?: string;
  data: any;
  type: string;
  timestamp: string;
  device_id: string;
  retry_count?: number;
}

interface ErrorDetail {
  table: string;
  id: string;
  type: string;
  error: string;
}

interface SyncError {
  change: SyncData;
  error: string;
}

interface SyncResult {
  success: boolean;
  count?: number;
  error?: string;
  errors?: ErrorDetail[];
  details?: any;
}

// In-memory database for operations
let memoryDb: DatabaseStore = {
  bookings: [],
  inventory: [],
  customers: [],
  transactions: [],
  transaction_items: [],
  staff: [],
  spa_services: [],
  menu_items: [],
  business_settings: [],
  general_settings: [],
  feedback: [], // Add feedback table
}

// Device ID for sync tracking
let deviceId = ""

// Sync configuration
const SYNC_CONFIG = {
  MAX_RETRIES: 3,
  BATCH_SIZE: 25,
  RETRY_DELAY: 1000, // ms
  CONNECTION_TIMEOUT: 10000, // ms
}

// Enhanced caching system
class DatabaseCache {
  private static instance: DatabaseCache;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private maxSize = 100;
  private defaultTTL = 5 * 60 * 1000;
  private hits = 0;
  private misses = 0;

  static getInstance(): DatabaseCache {
    if (!DatabaseCache.instance) {
      DatabaseCache.instance = new DatabaseCache();
    }
    return DatabaseCache.instance;
  }

  private constructor() {
    setInterval(() => this.cleanup(), 2 * 60 * 1000);
  }

  set(key: string, data: any, ttl: number = this.defaultTTL): void {
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, {
      data: JSON.parse(JSON.stringify(data)),
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.recordMiss();
      return null;
    }
    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      this.recordMiss();
      return null;
    }
    this.recordHit();
    return JSON.parse(JSON.stringify(entry.data));
  }

  invalidate(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.hits / (this.hits + this.misses) || 0
    };
  }

  private recordHit() {
    this.hits++;
  }

  private recordMiss() {
    this.misses++;
  }
}

// Enhanced query optimization
class QueryOptimizer {
  private static instance: QueryOptimizer;
  private indexCache = new Map<string, Map<string, Map<string, any[]>>>();

  static getInstance(): QueryOptimizer {
    if (!QueryOptimizer.instance) {
      QueryOptimizer.instance = new QueryOptimizer();
    }
    return QueryOptimizer.instance;
  }

  createIndex(table: string, field: string, records: any[]): void {
    if (!this.indexCache.has(table)) {
      this.indexCache.set(table, new Map());
    }
    const tableIndexes = this.indexCache.get(table)!;
    const index = new Map<string, any[]>();

    records.forEach(record => {
      const value = record[field];
      if (value !== undefined && value !== null) {
        const key = String(value);
        if (!index.has(key)) {
          index.set(key, []);
        }
        index.get(key)!.push(record);
      }
    });

    tableIndexes.set(field, index);
  }

  queryByIndex(table: string, field: string, value: any): any[] | null {
    const tableIndexes = this.indexCache.get(table);
    if (!tableIndexes) return null;
    const fieldIndex = tableIndexes.get(field);
    if (!fieldIndex) return null;
    return fieldIndex.get(String(value)) || [];
  }

  invalidateIndex(table: string, field?: string): void {
    if (field) {
      this.indexCache.get(table)?.delete(field);
    } else {
      this.indexCache.delete(table);
    }
  }

  optimizeQuery(table: string, filters: any, records: any[]): any[] {
    const filterKeys = Object.keys(filters);
    if (filterKeys.length === 1) {
      const [field] = filterKeys;
      const indexed = this.queryByIndex(table, field, filters[field]);
      if (indexed) return indexed;
    }
    return records.filter((record) => {
      return Object.entries(filters).every(([key, value]) => record[key] === value);
    });
  }
}

// Memory management utilities
const memoryManager = {
  getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  },

  cleanup(): void {
    if ('gc' in window) {
      (window as any).gc();
    }
    const memUsage = this.getMemoryUsage();
    const threshold = 50 * 1024 * 1024;
    if (memUsage > threshold) {
      DatabaseCache.getInstance().clear();
      console.log('Memory cleanup performed due to high usage');
    }
  },

  paginate<T>(data: T[], page: number, pageSize: number = 50): { data: T[]; hasMore: boolean } {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return {
      data: data.slice(start, end),
      hasMore: end < data.length
    };
  }
};

// IndexedDB storage utilities
async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('RestaurantSpaDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('data')) {
        db.createObjectStore('data', { keyPath: 'id' });
      }
    };
  });
}

async function saveDatabaseToStorage(): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(['data'], 'readwrite');
    const store = transaction.objectStore('data');
    
    await store.put({
      id: 'memoryDb',
      data: memoryDb,
      pendingChanges,
      deviceId,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Failed to save database to storage:', error);
  }
}

async function loadDatabaseFromStorage(): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(['data'], 'readonly');
    const store = transaction.objectStore('data');
    const request = store.get('memoryDb');
    
    return new Promise((resolve, reject) => {
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          memoryDb = result.data || memoryDb;
          pendingChanges = result.pendingChanges || [];
          deviceId = result.deviceId || uuidv4();
        } else {
          deviceId = uuidv4();
        }
        resolve();
      };
    });
  } catch (error) {
    console.error('Failed to load database from storage:', error);
    deviceId = uuidv4();
  }
}

// Initialize database
async function initDatabase(): Promise<void> {
  if (isInitialized) return;
  
  await loadDatabaseFromStorage();
  isInitialized = true;
}

// Offline queue for operations
class OfflineQueue {
  private static instance: OfflineQueue;
  private queue: Array<{id: string, operation: string, table: string, data: any, retries: number}> = [];

  static getInstance(): OfflineQueue {
    if (!OfflineQueue.instance) {
      OfflineQueue.instance = new OfflineQueue();
    }
    return OfflineQueue.instance;
  }

  async addToQueue(operation: string, table: string, data: any, maxRetries: number = 3): Promise<string> {
    const id = uuidv4();
    this.queue.push({ id, operation, table, data, retries: maxRetries });
    return id;
  }
}

// Add record to IndexedDB
async function addToIndexedDB(table: string, record: any): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(['data'], 'readwrite');
    const store = transaction.objectStore('data');
    
    await store.put({
      id: `${table}_${record.id}`,
      table,
      data: record,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Failed to add to IndexedDB:', error);
  }
}

// Get single record
export async function getRecord(table: string, id: string): Promise<any | null> {
  await initDatabase();
  
  if (!memoryDb[table]) {
    return null;
  }
  
  return memoryDb[table].find(record => record.id === id) || null;
}

// Enhanced database operations with caching
export async function listRecords(table: string, filters: any = {}) {
  await initDatabase()
  
  const cache = DatabaseCache.getInstance();
  const optimizer = QueryOptimizer.getInstance();
  
  const cacheKey = `${table}:${JSON.stringify(filters)}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  if (!memoryDb[table]) {
    return []
  }

  let results: any[];
  if (Object.keys(filters).length > 0) {
    results = optimizer.optimizeQuery(table, filters, memoryDb[table]);
  } else {
    results = [...memoryDb[table]];
  }

  cache.set(cacheKey, results);
  
  if (Object.keys(filters).length === 1) {
    const [field] = Object.keys(filters);
    optimizer.createIndex(table, field, memoryDb[table]);
  }

  return results;
}

// Enhanced create with cache invalidation
export async function createRecord(table: string, data: any) {
  const id = data.id || uuidv4()
  const timestamp = new Date().toISOString()

  const record = {
    id,
    ...data,
    created_at: timestamp,
    updated_at: timestamp,
    is_synced: 0,
  }

  if (!memoryDb[table]) {
    memoryDb[table] = []
  }

  memoryDb[table].push(record)

  pendingChanges.push({
    type: "create",
    table,
    data: record,
    timestamp,
    device_id: deviceId,
  })

  await saveDatabaseToStorage()

  const cache = DatabaseCache.getInstance();
  const optimizer = QueryOptimizer.getInstance();
  
  cache.invalidate(`${table}:`);
  optimizer.invalidateIndex(table);
  
  return record;
}

// Enhanced update with cache invalidation
export async function updateRecord(table: string, id: string, data: any) {
  await initDatabase()

  if (!memoryDb[table]) {
    throw new Error(`Table ${table} does not exist`)
  }

  const timestamp = new Date().toISOString()
  const index = memoryDb[table].findIndex((record) => record.id === id)

  if (index === -1) {
    throw new Error(`Record with id ${id} not found in ${table}`)
  }

  const updatedRecord = {
    ...memoryDb[table][index],
    ...data,
    updated_at: timestamp,
    is_synced: 0,
  }

  memoryDb[table][index] = updatedRecord

  pendingChanges.push({
    type: "update",
    table,
    id,
    data,
    timestamp,
    device_id: deviceId,
  })

  await saveDatabaseToStorage()

  const cache = DatabaseCache.getInstance();
  const optimizer = QueryOptimizer.getInstance();
  
  cache.invalidate(`${table}:`);
  optimizer.invalidateIndex(table);
  
  return updatedRecord;
}

// Enhanced delete with cache invalidation
export async function deleteRecord(table: string, id: string) {
  await initDatabase()

  if (!memoryDb[table]) {
    return { success: true }
  }

  const index = memoryDb[table].findIndex((record) => record.id === id)

  if (index !== -1) {
    const record = memoryDb[table][index]
    memoryDb[table].splice(index, 1)

    pendingChanges.push({
      type: "delete",
      table,
      id,
      data: record,
      timestamp: new Date().toISOString(),
      device_id: deviceId,
    })

    await saveDatabaseToStorage()
  }

  const cache = DatabaseCache.getInstance();
  const optimizer = QueryOptimizer.getInstance();
  
  cache.invalidate(`${table}:`);
  optimizer.invalidateIndex(table);
  
  return { success: true }
}

// Enhanced transaction API with better performance
export const transactionsApi = {
  create: async (transaction: any) => {
    if (!navigator.onLine) {
      const queue = OfflineQueue.getInstance();
      const queueId = await queue.addToQueue('create', 'transactions', transaction, 3);
      
      const localTransaction = {
        ...transaction,
        id: transaction.id || crypto.randomUUID(),
        _offline: true,
        _queueId: queueId,
        _createdAt: new Date().toISOString()
      };
      
      await addToIndexedDB('transactions', localTransaction);
      return localTransaction;
    }
    
    return createRecord("transactions", transaction);
  },
  get: (id: string) => getRecord("transactions", id),
  update: (id: string, data: any) => updateRecord("transactions", id, data),
  delete: (id: string) => deleteRecord("transactions", id),
  list: (filters: any = {}) => listRecords("transactions", filters),

  addItem: async (transactionId: string, item: any) => {
    const itemId = uuidv4()
    const itemData = {
      id: itemId,
      transaction_id: transactionId,
      item_name: item.name,
      quantity: item.quantity,
      price: item.price,
    }
    await createRecord("transaction_items", itemData)
    return itemData
  },

  getItems: async (transactionId: string) => {
    await initDatabase()
    if (!memoryDb["transaction_items"]) {
      return []
    }
    return memoryDb["transaction_items"].filter((item) => item.transaction_id === transactionId)
  },

  getDailyRevenue: async (days: number = 7) => {
    const cache = DatabaseCache.getInstance();
    const cacheKey = `daily_revenue:${days}`;
    
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    await initDatabase()
    if (!memoryDb.transactions) return []

    const optimizer = QueryOptimizer.getInstance();
    optimizer.createIndex('transactions', 'status', memoryDb.transactions);
    
    let completedTransactions = optimizer.queryByIndex('transactions', 'status', 'completed') || [];
    const paidTransactions = optimizer.queryByIndex('transactions', 'status', 'paid') || [];
    completedTransactions = [...completedTransactions, ...paidTransactions];

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    type RevenueData = { [key: string]: { spa: number, restaurant: number, name: string } };
    const revenueByDay: RevenueData = {};

    const dateRange = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      dateRange.push(dateString);
      revenueByDay[dateString] = { 
        spa: 0, 
        restaurant: 0, 
        name: dayNames[date.getDay()] 
      };
    }

    const dateSet = new Set(dateRange);
    completedTransactions.forEach(transaction => {
      const date = transaction.transaction_date.split('T')[0];
      
      if (dateSet.has(date)) {
        const serviceType = transaction.transaction_type?.toLowerCase() || "restaurant";
        const amount = transaction.total_amount || 0;
        
        if (serviceType === "spa") {
          revenueByDay[date].spa += amount;
        } else {
          revenueByDay[date].restaurant += amount;
        }
      }
    });

    const result = dateRange.map(date => ({
      name: revenueByDay[date].name,
      spa: Math.round(revenueByDay[date].spa * 100) / 100,
      restaurant: Math.round(revenueByDay[date].restaurant * 100) / 100,
      date: date,
    }));

    cache.set(cacheKey, result, 5 * 60 * 1000);
    return result;
  },

  getRecent: async (limit: number = 10, page: number = 1) => {
    const cache = DatabaseCache.getInstance();
    const cacheKey = `recent_transactions:${limit}:${page}`;
    
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    await initDatabase();
    if (!memoryDb.transactions) return [];

    const sortedTransactions = [...memoryDb.transactions].sort((a, b) => {
      return new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime();
    });

    const result = memoryManager.paginate(sortedTransactions, page, limit);
    cache.set(cacheKey, result, 2 * 60 * 1000);
    return result;
  }
};

// Bookings API
export const bookingsApi = {
  create: (booking: any) => createRecord("bookings", booking),
  get: (id: string) => getRecord("bookings", id),
  update: (id: string, data: any) => updateRecord("bookings", id, data),
  delete: (id: string) => deleteRecord("bookings", id),
  list: (filters: any = {}) => listRecords("bookings", filters),
  getRecent: async (limit: number = 10) => {
    const cache = DatabaseCache.getInstance();
    const cacheKey = `recent_bookings:${limit}`;
    
    const cached = cache.get(cacheKey);
    if (cached) return cached;
    
    await initDatabase();
    if (!memoryDb.bookings) return [];
    
    const sortedBookings = [...memoryDb.bookings].sort((a, b) => {
      return new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime();
    });
    
    const result = sortedBookings.slice(0, limit);
    cache.set(cacheKey, result, 2 * 60 * 1000);
    return result;
  },
  getUpcoming: async (limit: number = 10) => {
    const cache = DatabaseCache.getInstance();
    const cacheKey = `upcoming_bookings:${limit}`;
    
    const cached = cache.get(cacheKey);
    if (cached) return cached;
    
    await initDatabase();
    if (!memoryDb.bookings) return [];
    
    const now = new Date();
    const upcomingBookings = memoryDb.bookings
      .filter(booking => new Date(booking.booking_date) >= now)
      .sort((a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime())
      .slice(0, limit);
    
    cache.set(cacheKey, upcomingBookings, 2 * 60 * 1000);
    return upcomingBookings;
  }
};

// Customers API
export const customersApi = {
  create: (customer: any) => createRecord("customers", customer),
  get: (id: string) => getRecord("customers", id),
  update: (id: string, data: any) => updateRecord("customers", id, data),
  delete: (id: string) => deleteRecord("customers", id),
  list: (filters: any = {}) => listRecords("customers", filters)
};

// Spa Services API
export const spaServicesApi = {
  create: (service: any) => createRecord("spa_services", service),
  get: (id: string) => getRecord("spa_services", id),
  update: (id: string, data: any) => updateRecord("spa_services", id, data),
  delete: (id: string) => deleteRecord("spa_services", id),
  list: (filters: any = {}) => listRecords("spa_services", filters),
  listActive: async () => {
    const services = await listRecords("spa_services", { status: "active" });
    return services.filter((service: any) => service.isActive !== false);
  }
};

// Menu Items API
export const menuItemsApi = {
  create: (item: any) => createRecord("menu_items", item),
  get: (id: string) => getRecord("menu_items", id),
  update: (id: string, data: any) => updateRecord("menu_items", id, data),
  delete: (id: string) => deleteRecord("menu_items", id),
  list: (filters: any = {}) => listRecords("menu_items", filters),
  listByCategory: async (category: string) => {
    const items = await listRecords("menu_items", { category });
    return items.filter((item: any) => item.status === "active" || item.isAvailable !== false);
  },
  listActive: async () => {
    const items = await listRecords("menu_items", { status: "active" });
    return items.filter((item: any) => item.isActive !== false);
  }
};

// Staff API
export const staffApi = {
  create: (staff: any) => createRecord("staff", staff),
  get: (id: string) => getRecord("staff", id),
  update: (id: string, data: any) => updateRecord("staff", id, data),
  delete: (id: string) => deleteRecord("staff", id),
  list: (filters: any = {}) => listRecords("staff", filters)
};

// Inventory API
export const inventoryApi = {
  create: (item: any) => createRecord("inventory", item),
  get: (id: string) => getRecord("inventory", id),
  update: (id: string, data: any) => updateRecord("inventory", id, data),
  delete: (id: string) => deleteRecord("inventory", id),
  list: (filters: any = {}) => listRecords("inventory", filters)
};

// Business Settings API
export const businessSettingsApi = {
  create: (settings: any) => createRecord("business_settings", settings),
  get: (id: string) => getRecord("business_settings", id),
  update: (id: string, data: any) => updateRecord("business_settings", id, data),
  delete: (id: string) => deleteRecord("business_settings", id),
  list: (filters: any = {}) => listRecords("business_settings", filters),
  getSettings: async (defaultSettings: any = {}) => {
    await initDatabase();
    const settings = await listRecords("business_settings");
    if (settings.length > 0) {
      return { ...defaultSettings, ...settings[0] };
    }
    // Create default settings if none exist
    const newSettings = await createRecord("business_settings", defaultSettings);
    return newSettings;
  }
};

// General Settings API
export const generalSettingsApi = {
  create: (settings: any) => createRecord("general_settings", settings),
  get: (id: string) => getRecord("general_settings", id),
  update: (id: string, data: any) => updateRecord("general_settings", id, data),
  delete: (id: string) => deleteRecord("general_settings", id),
  list: (filters: any = {}) => listRecords("general_settings", filters),
  getSettings: async (defaultSettings: any = {}) => {
    await initDatabase();
    const settings = await listRecords("general_settings");
    if (settings.length > 0) {
      return { ...defaultSettings, ...settings[0] };
    }
    // Create default settings if none exist
    const newSettings = await createRecord("general_settings", defaultSettings);
    return newSettings;
  }
};

// Feedback API
export const feedbackApi = {
  create: (feedback: any) => createRecord("feedback", feedback),
  get: (id: string) => getRecord("feedback", id),
  update: (id: string, data: any) => updateRecord("feedback", id, data),
  delete: (id: string) => deleteRecord("feedback", id),
  list: (filters: any = {}) => listRecords("feedback", filters),
  getRecent: async (limit: number = 10) => {
    const cache = DatabaseCache.getInstance();
    const cacheKey = `recent_feedback:${limit}`;
    
    const cached = cache.get(cacheKey);
    if (cached) return cached;
    
    await initDatabase();
    if (!memoryDb.feedback) return [];
    
    const sortedFeedback = [...memoryDb.feedback].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    
    const result = sortedFeedback.slice(0, limit);
    cache.set(cacheKey, result, 2 * 60 * 1000);
    return result;
  },
  getAverageRating: async () => {
    const cache = DatabaseCache.getInstance();
    const cacheKey = `average_rating`;
    
    const cached = cache.get(cacheKey);
    if (cached) return cached;
    
    await initDatabase();
    if (!memoryDb.feedback || memoryDb.feedback.length === 0) return 0;
    
    const totalRating = memoryDb.feedback.reduce((sum: number, feedback: any) => {
      return sum + (feedback.rating || 0);
    }, 0);
    
    const average = totalRating / memoryDb.feedback.length;
    const result = Math.round(average * 10) / 10; // Round to 1 decimal place
    
    cache.set(cacheKey, result, 5 * 60 * 1000);
    return result;
  },
  getRatingDistribution: async () => {
    const cache = DatabaseCache.getInstance();
    const cacheKey = `rating_distribution`;
    
    const cached = cache.get(cacheKey);
    if (cached) return cached;
    
    await initDatabase();
    if (!memoryDb.feedback) return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    memoryDb.feedback.forEach((feedback: any) => {
      const rating = feedback.rating;
      if (rating >= 1 && rating <= 5) {
        distribution[rating as keyof typeof distribution]++;
      }
    });
    
    cache.set(cacheKey, distribution, 5 * 60 * 1000);
    return distribution;
  }
};

// Settings API
export const settingsApi = {
  getOperatingHours: async () => {
    const settings = await getRecord("settings", "operating_hours");
    if (!settings) {
      // Return default hours if not set
      return {
        id: "operating_hours",
        data: [
          { day: "Monday", opens_at: "09:00", closes_at: "18:00", is_closed: false, day_order: 1 },
          { day: "Tuesday", opens_at: "09:00", closes_at: "18:00", is_closed: false, day_order: 2 },
          { day: "Wednesday", opens_at: "09:00", closes_at: "18:00", is_closed: false, day_order: 3 },
          { day: "Thursday", opens_at: "09:00", closes_at: "18:00", is_closed: false, day_order: 4 },
          { day: "Friday", opens_at: "09:00", closes_at: "19:00", is_closed: false, day_order: 5 },
          { day: "Saturday", opens_at: "10:00", closes_at: "16:00", is_closed: false, day_order: 6 },
          { day: "Sunday", opens_at: "10:00", closes_at: "14:00", is_closed: true, day_order: 7 },
        ]
      };
    }
    return settings;
  },
  
  updateOperatingHours: (hours: any[]) => {
    return updateRecord("settings", "operating_hours", { data: hours });
  },

  // Add other settings methods as needed...
};

// Export utility functions
export { initDatabase };

// Add sample data function
export async function addSampleData() {
  await initDatabase();
  
  // Add sample spa services if none exist
  const existingServices = await listRecords("spa_services");
  if (existingServices.length === 0) {
    await createRecord("spa_services", {
      name: "Swedish Massage",
      description: "Relaxing full body massage",
      duration: 60,
      price: 80,
      category: "massage",
      status: "active"
    });
    
    await createRecord("spa_services", {
      name: "Facial Treatment",
      description: "Deep cleansing facial",
      duration: 45,
      price: 60,
      category: "facial",
      status: "active"
    });
  }
  
  // Add sample menu items if none exist (without dietary field to avoid sync issues)
  const existingItems = await listRecords("menu_items");
  if (existingItems.length === 0) {
    // Food items
    await createRecord("menu_items", {
      name: "Caesar Salad",
      description: "Fresh lettuce with caesar dressing and croutons",
      price: 12,
      category: "food",
      status: "active"
    });
    
    await createRecord("menu_items", {
      name: "Grilled Salmon",
      description: "Fresh salmon with herbs and lemon",
      price: 25,
      category: "food",
      status: "active"
    });

    await createRecord("menu_items", {
      name: "Pasta Carbonara",
      description: "Creamy pasta with bacon and parmesan",
      price: 18,
      category: "food",
      status: "active"
    });

    await createRecord("menu_items", {
      name: "Chicken Burger",
      description: "Grilled chicken breast with lettuce and tomato",
      price: 15,
      category: "food",
      status: "active"
    });

    // Drinks
    await createRecord("menu_items", {
      name: "Fresh Orange Juice",
      description: "Freshly squeezed orange juice",
      price: 5,
      category: "drinks",
      status: "active"
    });

    await createRecord("menu_items", {
      name: "Coffee",
      description: "Freshly brewed coffee",
      price: 3,
      category: "drinks",
      status: "active"
    });

    await createRecord("menu_items", {
      name: "Smoothie Bowl",
      description: "Mixed berry smoothie with granola",
      price: 8,
      category: "drinks",
      status: "active"
    });

    // Desserts
    await createRecord("menu_items", {
      name: "Chocolate Cake",
      description: "Rich chocolate cake with vanilla ice cream",
      price: 7,
      category: "desserts",
      status: "active"
    });

    await createRecord("menu_items", {
      name: "Tiramisu",
      description: "Classic Italian tiramisu",
      price: 8,
      category: "desserts",
      status: "active"
    });

    await createRecord("menu_items", {
      name: "Ice Cream Sundae",
      description: "Vanilla ice cream with chocolate sauce and nuts",
      price: 6,
      category: "desserts",
      status: "active"
    });
  }
}

// Performance monitoring
export const performanceMonitor = {
  startTimer: (label: string) => {
    console.time(label);
  },
  
  endTimer: (label: string) => {
    console.timeEnd(label);
  },
  
  getStats: () => ({
    memoryUsage: memoryManager.getMemoryUsage(),
    cacheStats: DatabaseCache.getInstance().getStats(),
    pendingChanges: pendingChanges.length,
    tablesSizes: Object.fromEntries(
      Object.entries(memoryDb).map(([table, data]) => [table, data.length])
    )
  }),
  
  enableAutoCleanup: () => {
    setInterval(() => {
      memoryManager.cleanup();
    }, 10 * 60 * 1000);
  }
};

// Initialize performance monitoring
if (typeof window !== "undefined") {
  performanceMonitor.enableAutoCleanup();
}
