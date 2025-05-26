// Browser-compatible database utility using IndexedDB with Supabase sync
import { v4 as uuidv4 } from "uuid"
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase"

// Track pending changes for sync
let pendingChanges: SyncData[] = []
let isInitialized = false

// Database structure
interface Record {
  id: string
  [key: string]: any
}

interface DatabaseStore {
  [table: string]: Record[]
}

// Define error interface
interface SyncData {
  table: string;
  id?: string;
  data: any;
  type: string;
  timestamp: string;
  device_id: string;
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
  business_settings: [], // Added business_settings table
  general_settings: [], // Added general_settings table
}

// Device ID for sync tracking
let deviceId = ""

// Initialize the database
export async function initDatabase() {
  if (isInitialized) return true

  // Only run in browser
  if (typeof window === "undefined") return false

  try {
    // Generate or retrieve device ID
    deviceId = localStorage.getItem("device_id") || uuidv4()
    localStorage.setItem("device_id", deviceId)

    // Load data from IndexedDB if available
    await loadDatabaseFromStorage()

    isInitialized = true
    console.log("Database initialized in the browser")
    return true
  } catch (error) {
    console.error("Failed to initialize database:", error)
    return false
  }
}

// Save database to IndexedDB for persistence
async function saveDatabaseToStorage() {
  if (typeof window === "undefined") return

  try {
    // Open IndexedDB
    const dbPromise = indexedDB.open("SpaRestaurantDB", 1)

    // Create object stores if needed
    dbPromise.onupgradeneeded = (event) => {
      const db = (event.target as IDBRequest).result

      // Create stores for each table if they don't exist
      if (!db.objectStoreNames.contains("database")) {
        db.createObjectStore("database")
      }

      if (!db.objectStoreNames.contains("pendingChanges")) {
        db.createObjectStore("pendingChanges")
      }
    }

    // Save data when DB is open
    return new Promise<void>((resolve, reject) => {
      dbPromise.onsuccess = () => {
        const db = dbPromise.result
        const tx = db.transaction(["database", "pendingChanges"], "readwrite")
        const dbStore = tx.objectStore("database")
        const changesStore = tx.objectStore("pendingChanges")

        // Store the entire database as JSON
        dbStore.put(JSON.stringify(memoryDb), "dbData")

        // Store pending changes
        changesStore.put(JSON.stringify(pendingChanges), "changes")

        tx.oncomplete = () => {
          db.close()
          resolve()
        }

        tx.onerror = () => {
          reject(new Error("Failed to save database"))
        }
      }

      dbPromise.onerror = () => {
        reject(new Error("Failed to open IndexedDB"))
      }
    })
  } catch (error) {
    console.error("Failed to save database to storage:", error)
  }
}

// Load database from IndexedDB
async function loadDatabaseFromStorage() {
  if (typeof window === "undefined") return

  try {
    // Open IndexedDB
    const dbPromise = indexedDB.open("SpaRestaurantDB", 1)

    // Create object stores if needed
    dbPromise.onupgradeneeded = (event) => {
      const db = (event.target as IDBRequest).result

      if (!db.objectStoreNames.contains("database")) {
        db.createObjectStore("database")
      }

      if (!db.objectStoreNames.contains("pendingChanges")) {
        db.createObjectStore("pendingChanges")
      }
    }

    // Load data when DB is open
    return new Promise<void>((resolve, reject) => {
      dbPromise.onsuccess = () => {
        const db = dbPromise.result
        const tx = db.transaction(["database", "pendingChanges"], "readonly")
        const dbStore = tx.objectStore("database")
        const changesStore = tx.objectStore("pendingChanges")

        const dbRequest = dbStore.get("dbData")
        const changesRequest = changesStore.get("changes")

        dbRequest.onsuccess = () => {
          if (dbRequest.result) {
            try {
              memoryDb = JSON.parse(dbRequest.result)
              console.log("Database loaded from IndexedDB")
            } catch (e) {
              console.error("Error parsing database from storage:", e)
            }
          }

          changesRequest.onsuccess = () => {
            if (changesRequest.result) {
              try {
                pendingChanges = JSON.parse(changesRequest.result)
                console.log("Pending changes loaded from IndexedDB:", pendingChanges.length)
              } catch (e) {
                console.error("Error parsing pending changes from storage:", e)
              }
            }

            db.close()
            resolve()
          }

          changesRequest.onerror = () => {
            db.close()
            reject(new Error("Failed to load pending changes"))
          }
        }

        dbRequest.onerror = () => {
          db.close()
          reject(new Error("Failed to load database"))
        }
      }

      dbPromise.onerror = () => {
        reject(new Error("Failed to open IndexedDB"))
      }
    })
  } catch (error) {
    console.error("Failed to load database from storage:", error)
  }
}

// Generic CRUD operations
export async function createRecord(table: string, data: any) {
  await initDatabase()

  const id = data.id || uuidv4()
  const timestamp = new Date().toISOString()

  // Create the record with timestamps
  const record = {
    id,
    ...data,
    created_at: timestamp,
    updated_at: timestamp,
    is_synced: 0,
  }

  // Ensure the table exists
  if (!memoryDb[table]) {
    memoryDb[table] = []
  }

  // Add to memory database
  memoryDb[table].push(record)

  // Add to pending changes
  pendingChanges.push({
    type: "create",
    table,
    data: record,
    timestamp,
    device_id: deviceId,
  })

  // Save to persistent storage
  await saveDatabaseToStorage()

  return record
}

export async function getRecord(table: string, id: string) {
  await initDatabase()

  // Ensure the table exists
  if (!memoryDb[table]) {
    return null
  }

  // Find the record
  return memoryDb[table].find((record) => record.id === id) || null
}

export async function updateRecord(table: string, id: string, data: any) {
  await initDatabase()

  // Ensure the table exists
  if (!memoryDb[table]) {
    throw new Error(`Table ${table} does not exist`)
  }

  const timestamp = new Date().toISOString()

  // Find the record index
  const index = memoryDb[table].findIndex((record) => record.id === id)

  if (index === -1) {
    throw new Error(`Record with id ${id} not found in ${table}`)
  }

  // Update the record
  const updatedRecord = {
    ...memoryDb[table][index],
    ...data,
    updated_at: timestamp,
    is_synced: 0,
  }

  memoryDb[table][index] = updatedRecord

  // Add to pending changes
  pendingChanges.push({
    type: "update",
    table,
    id,
    data,
    timestamp,
    device_id: deviceId,
  })

  // Save to persistent storage
  await saveDatabaseToStorage()

  return updatedRecord
}

export async function deleteRecord(table: string, id: string) {
  await initDatabase()

  // Ensure the table exists
  if (!memoryDb[table]) {
    return { success: true }
  }

  // Find the record index
  const index = memoryDb[table].findIndex((record) => record.id === id)

  if (index !== -1) {
    // Get the record before removing it
    const record = memoryDb[table][index]

    // Remove from memory database
    memoryDb[table].splice(index, 1)

    // Add to pending changes
    pendingChanges.push({
      type: "delete",
      table,
      id,
      data: record, // Include the record data for sync purposes
      timestamp: new Date().toISOString(),
      device_id: deviceId,
    })

    // Save to persistent storage
    await saveDatabaseToStorage()
  }

  return { success: true }
}

export async function listRecords(table: string, filters: any = {}) {
  await initDatabase()

  // Ensure the table exists
  if (!memoryDb[table]) {
    return []
  }

  // Apply filters if any
  if (Object.keys(filters).length > 0) {
    return memoryDb[table].filter((record) => {
      return Object.entries(filters).every(([key, value]) => record[key] === value)
    })
  }

  // Return all records
  return [...memoryDb[table]]
}

// Sync functions
export function getPendingChangesCount() {
  return pendingChanges.length
}

export async function syncWithSupabase() {
  if (typeof window === "undefined" || pendingChanges.length === 0 || !isSupabaseConfigured()) {
    return { success: true, count: 0 };
  }

  try {
    const supabase = getSupabaseBrowserClient();
    
    try {
      const { error: pingError } = await supabase.from('sync_log').select('count', { count: 'exact', head: true });
      
      if (pingError && typeof pingError.message === 'string' && !pingError.message.includes('does not exist')) {
        return { success: false, error: `Supabase connection error: ${pingError.message}` };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: `Failed to connect to Supabase: ${errorMessage}` };
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: SyncError[] = [];

    // Process changes in batches to avoid overwhelming the server
    const batchSize = 50;
    const batches = Math.ceil(pendingChanges.length / batchSize);
    
    for (let i = 0; i < batches; i++) {
      const batchStart = i * batchSize;
      const batchEnd = Math.min((i + 1) * batchSize, pendingChanges.length);
      const batch = pendingChanges.slice(batchStart, batchEnd);
      
      // Process each change in the batch
      for (const change of batch) {
        try {
          const { type, table, id, data, timestamp } = change;
          
          if (type === "create" || type === "update") {
            // For create and update, use upsert
            // Remove is_synced from the data before sending to Supabase
            const { is_synced, ...dataWithoutSync } = data;
            const { error } = await supabase.from(table).upsert({
              ...dataWithoutSync,
              updated_at: new Date().toISOString(),
            });
            
            if (error) {
              // Check if this is a "relation does not exist" error
              if (error.message && error.message.includes("does not exist")) {
                console.log(`Table ${table} does not exist yet in Supabase, skipping sync for this change`);
                // We'll count this as a success since it's not a real error, just a table that needs to be created
                successCount++;
                continue;
              }
              throw new Error(error.message || 'Unknown database error');
            }
          } else if (type === "delete") {
            // For delete, remove the record
            const { error } = await supabase.from(table).delete().eq("id", id);
            
            if (error) {
              // Check if this is a "relation does not exist" error
              if (error.message && error.message.includes("does not exist")) {
                console.log(`Table ${table} does not exist yet in Supabase, skipping sync for this change`);
                // We'll count this as a success since it's not a real error, just a table that needs to be created
                successCount++;
                continue;
              }
              throw new Error(error.message || 'Unknown database error');
            }
          }
          
          // Log successful sync
          try {
            await supabase.from("sync_log").insert({
              device_id: deviceId,
              sync_type: "push",
              entity_type: table,
              entity_id: id,
              operation: type,
              status: "success",
            });
          } catch (logError: any) {
            // If sync_log table doesn't exist yet, just continue
            if (logError.message && logError.message.includes("does not exist")) {
              console.log("sync_log table does not exist yet, skipping log entry");
            } else {
              console.error("Failed to log sync success:", logError);
            }
          }
          
          successCount++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error("Error syncing change:", errorMessage, change);
          errorCount++;
          errors.push({ change, error: errorMessage });
          
          // Log failed sync
          try {
            await supabase.from("sync_log").insert({
              device_id: deviceId,
              sync_type: "push",
              entity_type: change.table,
              entity_id: change.id,
              operation: change.type,
              status: "error",
              error_message: errorMessage,
            });
          } catch (logError: any) {
            // If sync_log table doesn't exist yet, just continue
            if (logError.message && logError.message.includes("does not exist")) {
              console.log("sync_log table does not exist yet, skipping log entry");
            } else {
              console.error("Failed to log sync error:", logError);
            }
          }
        }
      }
    }
    
    // Remove successfully synced changes
    if (successCount > 0) {
      // Keep only the failed changes
      pendingChanges = pendingChanges.filter((_, index) => {
        const batchIndex = Math.floor(index / batchSize);
        const indexInBatch = index % batchSize;
        const batchStart = batchIndex * batchSize;
        // Check if this change is in a processed batch and failed
        return errors.some((e) => e.change === pendingChanges[batchStart + indexInBatch]);
      });
      
      // Save updated pending changes
      await saveDatabaseToStorage();
      
      // Mark all records as synced
      Object.keys(memoryDb).forEach((table) => {
        memoryDb[table] = memoryDb[table].map((record) => ({
          ...record,
          is_synced: 1,
        }));
      });
      
      await saveDatabaseToStorage();
    }
    
    return {
      success: errorCount === 0,
      count: successCount,
      errors: errorCount > 0 ? errors.map(e => ({
        table: e.change.table,
        id: e.change.id,
        type: e.change.type,
        error: e.error
      })) : undefined,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Sync error:", errorMessage);
    return { 
      success: false, 
      error: errorMessage,
      details: error 
    };
  }
}

// Pull changes from Supabase
export async function pullFromSupabase() {
  if (typeof window === "undefined" || !isSupabaseConfigured()) {
    return { success: true, count: 0 }
  }

  try {
    const supabase = getSupabaseBrowserClient()
    let totalChanges = 0

    // Get the latest sync timestamp for this device
    const lastSyncKey = `last_sync_${deviceId}`
    const lastSync = localStorage.getItem(lastSyncKey) || new Date(0).toISOString()
    const now = new Date().toISOString()

    // For each table, pull changes since last sync
    for (const table of Object.keys(memoryDb)) {
      // Skip transaction_items as they're handled with transactions
      if (table === "transaction_items") continue

      try {
        // Get records updated since last sync
        const { data, error } = await supabase.from(table).select("*").gt("updated_at", lastSync)

        if (error) {
          // Check if this is a "relation does not exist" error
          if (error.message && error.message.includes("does not exist")) {
            console.log(`Table ${table} does not exist yet in Supabase, skipping sync`)
            continue
          }

          console.error(`Error pulling ${table} changes:`, error)
          continue
        }

        if (!data || data.length === 0) continue

        // Process each record
        for (const record of data) {
          // Skip records from this device (already in local DB)
          const changeFromThisDevice = pendingChanges.some(
            (change) => change.table === table && change.id === record.id,
          )

          if (changeFromThisDevice) continue

          // Check if record exists locally
          const localIndex = memoryDb[table].findIndex((r) => r.id === record.id)

          if (localIndex >= 0) {
            // Update existing record
            memoryDb[table][localIndex] = {
              ...record,
              is_synced: 1,
            }
          } else {
            // Add new record
            memoryDb[table].push({
              ...record,
              is_synced: 1,
            })
          }

          totalChanges++
        }
      } catch (error) {
        console.error(`Error processing ${table} changes:`, error)
        continue
      }
    }

    // Handle transaction_items separately (with their parent transactions)
    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("*, transaction_items(*)")
      .gt("updated_at", lastSync)

    if (!txError && transactions && transactions.length > 0) {
      for (const tx of transactions) {
        // Skip transactions from this device
        const txFromThisDevice = pendingChanges.some((change) => change.table === "transactions" && change.id === tx.id)

        if (txFromThisDevice) continue

        // Process transaction
        const localTxIndex = memoryDb.transactions.findIndex((t) => t.id === tx.id)

        if (localTxIndex >= 0) {
          // Update existing transaction
          memoryDb.transactions[localTxIndex] = {
            ...tx,
            transaction_items: undefined, // Remove items, we'll handle them separately
            is_synced: 1,
          }
        } else {
          // Add new transaction
          memoryDb.transactions.push({
            ...tx,
            transaction_items: undefined, // Remove items, we'll handle them separately
            is_synced: 1,
          })
        }

        // Process transaction items
        if (tx.transaction_items && tx.transaction_items.length > 0) {
          for (const item of tx.transaction_items) {
            const localItemIndex = memoryDb.transaction_items.findIndex((i) => i.id === item.id)

            if (localItemIndex >= 0) {
              // Update existing item
              memoryDb.transaction_items[localItemIndex] = {
                ...item,
                is_synced: 1,
              }
            } else {
              // Add new item
              memoryDb.transaction_items.push({
                ...item,
                is_synced: 1,
              })
            }

            totalChanges++
          }
        }

        totalChanges++
      }
    }

    // Save updated database
    if (totalChanges > 0) {
      await saveDatabaseToStorage()
    }

    // Update last sync timestamp
    localStorage.setItem(lastSyncKey, now)

    return { success: true, count: totalChanges }
  } catch (error) {
    console.error("Pull sync error:", error)
    return { success: false, error: String(error) }
  }
}

// Specific APIs for each entity
export const bookingsApi = {
  create: (data: any) => createRecord("bookings", data),
  get: (id: string) => getRecord("bookings", id),
  update: (id: string, data: any) => updateRecord("bookings", id, data),
  delete: (id: string) => deleteRecord("bookings", id),
  list: (filters: any = {}) => listRecords("bookings", filters),

  // Get recent bookings (newest first, limited to count)
  getRecent: async (count: number = 5) => {
    await initDatabase()
    if (!memoryDb.bookings) return []

    // Sort by date (newest first)
    const sortedBookings = [...memoryDb.bookings].sort((a, b) => {
      const dateA = new Date(`${a.booking_date}T${a.booking_time || '00:00:00'}`)
      const dateB = new Date(`${b.booking_date}T${b.booking_time || '00:00:00'}`)
      return dateB.getTime() - dateA.getTime() // Descending order
    })

    // Take only the specified number of most recent bookings
    return sortedBookings.slice(0, count)
  },

  // Get upcoming bookings (future bookings, sorted by date)
  getUpcoming: async (count: number = 4) => {
    await initDatabase()
    if (!memoryDb.bookings) return []

    const today = new Date()
    today.setHours(0, 0, 0, 0) // Start of today

    // Filter for only upcoming bookings (today and future)
    const upcomingBookings = memoryDb.bookings.filter(booking => {
      const bookingDate = new Date(booking.booking_date)
      return bookingDate >= today && booking.status !== "cancelled"
    })

    // Sort by date and time (ascending)
    upcomingBookings.sort((a, b) => {
      const dateA = new Date(`${a.booking_date}T${a.booking_time || '00:00:00'}`)
      const dateB = new Date(`${b.booking_date}T${b.booking_time || '00:00:00'}`)
      return dateA.getTime() - dateB.getTime()
    })

    // Take only the specified number of upcoming bookings
    return upcomingBookings.slice(0, count)
  }
}

export const inventoryApi = {
  create: (data: any) => createRecord("inventory", data),
  get: (id: string) => getRecord("inventory", id),
  update: (id: string, data: any) => updateRecord("inventory", id, data),
  delete: (id: string) => deleteRecord("inventory", id),
  list: (filters: any = {}) => listRecords("inventory", filters),
}

export const customersApi = {
  create: (data: any) => createRecord("customers", data),
  get: (id: string) => getRecord("customers", id),
  update: (id: string, data: any) => updateRecord("customers", id, data),
  delete: (id: string) => deleteRecord("customers", id),
  list: (filters: any = {}) => listRecords("customers", filters),
}

export const transactionsApi = {
  create: (data: any) => createRecord("transactions", data),
  get: (id: string) => getRecord("transactions", id),
  update: (id: string, data: any) => updateRecord("transactions", id, data),
  delete: (id: string) => deleteRecord("transactions", id),
  list: (filters: any = {}) => listRecords("transactions", filters),

  // Additional method for transaction items
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

  // Get daily revenue data for the last N days
  getDailyRevenue: async (days: number = 7) => {
    await initDatabase()
    if (!memoryDb.transactions) return []

    // Get completed transactions
    const completedTransactions = memoryDb.transactions.filter(
      tx => tx.status === "completed" || tx.status === "paid"
    )

    // Get the range of days
    const today = new Date()
    today.setHours(23, 59, 59, 999) // End of today

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    type RevenueData = { [key: string]: { spa: number, restaurant: number, name: string } };
    const revenueByDay: RevenueData = {};

    // Initialize the last N days with zero values
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dayName = dayNames[date.getDay()]
      const dateString = date.toISOString().split('T')[0]
      revenueByDay[dateString] = { spa: 0, restaurant: 0, name: dayName }
    }

    // Aggregate transaction amounts by date and service type
    completedTransactions.forEach(transaction => {
      const date = transaction.transaction_date.split('T')[0]

      // Only include transactions from the specified days
      if (revenueByDay[date]) {
        const serviceType = transaction.transaction_type?.toLowerCase() || "restaurant"

        if (serviceType === "spa") {
          revenueByDay[date].spa += transaction.total_amount || 0
        } else {
          revenueByDay[date].restaurant += transaction.total_amount || 0
        }
      }
    })

    // Convert to array format for charts
    return Object.keys(revenueByDay).map(date => ({
      name: revenueByDay[date].name || dayNames[new Date(date).getDay()],
      spa: revenueByDay[date].spa,
      restaurant: revenueByDay[date].restaurant,
      date: date,
    }))
  }
}

export const staffApi = {
  create: (data: any) => createRecord("staff", data),
  get: (id: string) => getRecord("staff", id),
  update: (id: string, data: any) => updateRecord("staff", id, data),
  delete: (id: string) => deleteRecord("staff", id),
  list: (filters: any = {}) => listRecords("staff", filters),
}

// New API for spa services table
export const spaServicesApi = {
  create: (data: any) => createRecord("spa_services", data),
  get: (id: string) => getRecord("spa_services", id),
  update: (id: string, data: any) => updateRecord("spa_services", id, data),
  delete: (id: string) => deleteRecord("spa_services", id),
  list: (filters: any = {}) => listRecords("spa_services", filters),
  listActive: async () => {
    await initDatabase()
    if (!memoryDb["spa_services"]) {
      memoryDb["spa_services"] = []
      return []
    }
    return memoryDb["spa_services"].filter((service) => service.status === "active")
  },
}

// New API for menu items table
export const menuItemsApi = {
  create: (data: any) => createRecord("menu_items", data),
  get: (id: string) => getRecord("menu_items", id),
  update: (id: string, data: any) => updateRecord("menu_items", id, data),
  delete: (id: string) => deleteRecord("menu_items", id),
  list: (filters: any = {}) => listRecords("menu_items", filters),
  listActive: async () => {
    await initDatabase()
    if (!memoryDb["menu_items"]) {
      memoryDb["menu_items"] = []
      return []
    }
    return memoryDb["menu_items"].filter((item) => item.status === "active")
  },
  listByCategory: async (category: string) => {
    await initDatabase()
    if (!memoryDb["menu_items"]) {
      memoryDb["menu_items"] = []
      return []
    }
    return memoryDb["menu_items"].filter((item) => item.category === category && item.status === "active")
  },
}

// API for business settings
export const businessSettingsApi = {
  create: (data: any) => createRecord("business_settings", data),
  get: (id: string) => getRecord("business_settings", id),
  update: (id: string, data: any) => updateRecord("business_settings", id, data),
  delete: (id: string) => deleteRecord("business_settings", id),
  list: () => listRecords("business_settings"),

  // Get business settings (returns first record or default)
  getSettings: async (defaultSettings: any) => {
    await initDatabase()

    const settingsData = await listRecords("business_settings")

    if (settingsData && settingsData.length > 0) {
      // Use the first settings object found
      return settingsData[0]
    }

    // If no settings exist, create default settings in the database
    const newSettings = await createRecord("business_settings", defaultSettings)
    return newSettings
  }
}

// API for general settings
export const generalSettingsApi = {
  create: (data: any) => createRecord("general_settings", data),
  get: (id: string) => getRecord("general_settings", id),
  update: (id: string, data: any) => updateRecord("general_settings", id, data),
  delete: (id: string) => deleteRecord("general_settings", id),
  list: () => listRecords("general_settings"),
  
  // Get general settings (returns first record or default)
  getSettings: async (defaultSettings: any) => {
    await initDatabase()
    
    const settingsData = await listRecords("general_settings")
    
    if (settingsData && settingsData.length > 0) {
      // Use the first settings object found
      return settingsData[0]
    }

    // If no settings exist, create default settings in the database
    const newSettings = await createRecord("general_settings", defaultSettings)
    return newSettings
  }
}

// Add some sample data for testing
export async function addSampleData() {
  // Only add sample data if tables are empty
  await initDatabase()

  if (memoryDb.bookings.length === 0) {
    await bookingsApi.create({
      customer_name: "Sarah Johnson",
      customer_phone: "555-123-4567",
      customer_email: "sarah.j@example.com",
      booking_date: "2025-04-22",
      booking_time: "14:00",
      service: "massage",
      staff: "john",
      notes: "First time client",
      booking_type: "spa",
      status: "confirmed",
    })
  }

  if (memoryDb.inventory.length === 0) {
    await inventoryApi.create({
      name: "Massage Oil (Lavender)",
      category: "spa",
      quantity: 24,
      unit: "bottle",
      reorder_level: 10,
      last_updated: "2025-04-15",
    })
  }

  if (memoryDb.customers.length === 0) {
    await customersApi.create({
      name: "Sarah Johnson",
      email: "sarah.j@example.com",
      phone: "555-123-4567",
      visits: 8,
      last_visit: "2025-04-18",
      customer_type: "spa",
    })
  }

  // Add sample spa services if none exist
  if (!memoryDb.spa_services || memoryDb.spa_services.length === 0) {
    await spaServicesApi.create({
      name: "Deep Tissue Massage",
      description: "A therapeutic massage focused on realigning deeper layers of muscles",
      duration: 60,
      price: 120,
      category: "massage",
      status: "active",
    })

    await spaServicesApi.create({
      name: "Facial Treatment",
      description: "Comprehensive skincare treatment for face",
      duration: 45,
      price: 85,
      category: "skincare",
      status: "active",
    })

    await spaServicesApi.create({
      name: "Hot Stone Massage",
      description: "Massage therapy with hot stones for deeper relaxation",
      duration: 90,
      price: 150,
      category: "massage",
      status: "active",
    })

    await spaServicesApi.create({
      name: "Manicure & Pedicure",
      description: "Complete nail care for hands and feet",
      duration: 60,
      price: 65,
      category: "beauty",
      status: "active",
    })

    await spaServicesApi.create({
      name: "Body Scrub",
      description: "Exfoliating treatment to remove dead skin cells",
      duration: 45,
      price: 95,
      category: "body",
      status: "active",
    })

    await spaServicesApi.create({
      name: "Aromatherapy",
      description: "Therapeutic use of essential oils for relaxation",
      duration: 60,
      price: 110,
      category: "therapy",
      status: "active",
    })
  }

  // Add sample menu items if none exist
  if (!memoryDb.menu_items || memoryDb.menu_items.length === 0) {
    await menuItemsApi.create({
      name: "Grilled Salmon",
      description: "Fresh salmon grilled to perfection with herbs",
      price: 24,
      category: "main",
      preparation_time: 20,
      ingredients: "Salmon, olive oil, lemon, herbs",
      allergens: "Fish",
      status: "active",
    })

    await menuItemsApi.create({
      name: "Pasta Primavera",
      description: "Fresh seasonal vegetables with pasta",
      price: 18,
      category: "main",
      preparation_time: 15,
      ingredients: "Pasta, mixed vegetables, olive oil, garlic",
      allergens: "Gluten",
      status: "active",
    })

    await menuItemsApi.create({
      name: "Steak & Fries",
      description: "Grilled steak served with crispy fries",
      price: 32,
      category: "main",
      preparation_time: 25,
      ingredients: "Beef steak, potatoes, herbs, salt",
      allergens: "None",
      status: "active",
    })

    await menuItemsApi.create({
      name: "Caesar Salad",
      description: "Classic caesar salad with croutons",
      price: 12,
      category: "appetizer",
      preparation_time: 10,
      ingredients: "Romaine lettuce, croutons, parmesan, caesar dressing",
      allergens: "Dairy, Gluten",
      status: "active",
    })

    await menuItemsApi.create({
      name: "Vegetable Curry",
      description: "Spiced vegetable curry with rice",
      price: 16,
      category: "main",
      preparation_time: 20,
      ingredients: "Mixed vegetables, curry spices, coconut milk, rice",
      allergens: "None",
      status: "active",
    })

    await menuItemsApi.create({
      name: "Chocolate Cake",
      description: "Rich chocolate cake with ganache",
      price: 8,
      category: "dessert",
      preparation_time: 10,
      ingredients: "Chocolate, flour, sugar, eggs",
      allergens: "Dairy, Eggs, Gluten",
      status: "active",
    })

    await menuItemsApi.create({
      name: "House Wine (Glass)",
      description: "House selection red or white wine",
      price: 9,
      category: "beverage",
      preparation_time: 2,
      ingredients: "Grapes",
      allergens: "Sulfites",
      status: "active",
    })

    await menuItemsApi.create({
      name: "Sparkling Water",
      description: "Refreshing sparkling mineral water",
      price: 4,
      category: "beverage",
      preparation_time: 1,
      ingredients: "Water, minerals",
      allergens: "None",
      status: "active",
    })
  }
}
