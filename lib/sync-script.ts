// Enhanced sync script for restaurant management system
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase"
import { initDatabase, listRecords, createRecord, updateRecord, deleteRecord } from "@/lib/db"

// Define sync tables with their required constraints
const SYNC_TABLES = [
  'menu_items',
  'spa_services', 
  'transactions',
  'transaction_items',
  'customers',
  'bookings',
  'inventory',
  'staff',
  'business_settings',
  'general_settings'
];

// Data validation rules for each table
const TABLE_VALIDATION_RULES: Record<string, {
  required?: string[];
  enums?: Record<string, string[]>;
  defaults?: Record<string, any>;
}> = {
  menu_items: {
    required: ['name', 'price'],
    enums: {
      category: ['food', 'drinks', 'desserts', 'appetizers', 'mains'],
    },
    defaults: {
      category: 'food',
      status: 'active',
      is_available: true,
      price: 0
    }
  },
  transactions: {
    required: ['total_amount'],
    enums: {
      transaction_type: ['spa', 'restaurant', 'retail'],
      status: ['pending', 'completed', 'cancelled', 'refunded', 'paid']
    },
    defaults: {
      transaction_type: 'restaurant',
      status: 'pending',
      subtotal: 0,
      total_amount: 0,
      tax_amount: 0,
      tip_amount: 0
    }
  },
  staff: {
    required: ['name', 'email'],
    enums: {
      role: ['admin', 'manager', 'staff', 'therapist', 'chef', 'waiter']
    },
    defaults: {
      role: 'staff',
      is_active: true
    }
  },
  spa_services: {
    required: ['name', 'duration', 'price'],
    defaults: {
      status: 'active',
      is_active: true,
      duration: 60,
      price: 0
    }
  }
};

// Validate and clean record data for sync
function validateAndCleanRecord(record: any, tableName: string): any {
  const cleaned = { ...record };
  
  // Remove client-side fields
  delete cleaned._offline;
  delete cleaned._queueId;
  delete cleaned._createdAt;
  delete cleaned._pendingSync;
  
  const rules = TABLE_VALIDATION_RULES[tableName];
  if (!rules) return cleaned;
  
  // Set defaults for missing fields
  Object.keys(rules.defaults || {}).forEach(key => {
    if (cleaned[key] === undefined || cleaned[key] === null) {
      cleaned[key] = rules.defaults![key];
    }
  });

  // Ensure required fields are present
  (rules.required || []).forEach((field: string) => {
    if (!cleaned[field] || cleaned[field] === '') {
      if (rules.defaults && rules.defaults[field] !== undefined) {
        cleaned[field] = rules.defaults[field];
      } else if (field === 'name') {
        cleaned[field] = `Unnamed ${tableName.slice(0, -1)}`;
      } else {
        console.warn(`Missing required field ${field} in ${tableName}`);
      }
    }
  });

  // Validate enum fields
  Object.keys(rules.enums || {}).forEach(field => {
    if (field === 'category' && tableName === 'menu_items') {
      // Skip category validation for menu_items to allow any category value
      return;
    }
    if (cleaned[field] && !rules.enums![field].includes(cleaned[field])) {
      console.warn(`Invalid ${field} value '${cleaned[field]}' in ${tableName}, using default`);
      cleaned[field] = rules.defaults![field] || rules.enums![field][0];
    }
  });

  // Special validation for specific tables
  if (tableName === 'menu_items') {
    // Validate dietary array
    if (cleaned.dietary && Array.isArray(cleaned.dietary)) {
      cleaned.dietary = cleaned.dietary.filter((item: any) => 
        item && typeof item === 'string' && item.trim() !== ''
      );
    } else {
      cleaned.dietary = [];
    }
    
    // Ensure price is a valid number
    if (isNaN(parseFloat(cleaned.price))) {
      cleaned.price = 0;
    } else {
      cleaned.price = parseFloat(cleaned.price);
    }
    
    // Map isAvailable to status for compatibility
    if (cleaned.isAvailable !== undefined) {
      cleaned.status = cleaned.isAvailable ? 'active' : 'inactive';
      delete cleaned.isAvailable;
    }
    
    // Ensure status is valid
    if (!cleaned.status || !['active', 'inactive'].includes(cleaned.status)) {
      cleaned.status = 'active';
    }
    
    // Ensure is_available field is consistent with status
    cleaned.is_available = cleaned.status === 'active';
    
    // Validate category - if invalid, set to "other"
    const validCategories = ['appetizer', 'main', 'beverage', 'dessert', 'other'];
    if (!cleaned.category || !validCategories.includes(cleaned.category.toLowerCase())) {
      console.warn(`Invalid category '${cleaned.category}' for menu item '${cleaned.name}', setting to 'other'`);
      cleaned.category = 'other';
    } else {
      cleaned.category = cleaned.category.toLowerCase();
    }
    
    // Remove any unknown fields that might cause database constraint violations
    const allowedFields = [
      'id', 'name', 'description', 'price', 'category', 'dietary', 'is_available', 
      'status', 'image_url', 'preparation_time', 'ingredients', 'allergens',
      'created_at', 'updated_at', 'is_synced'
    ];
    
    Object.keys(cleaned).forEach(key => {
      if (!allowedFields.includes(key)) {
        console.warn(`Removing unknown field '${key}' from menu item '${cleaned.name}'`);
        delete cleaned[key];
      }
    });
    
    // Ensure string fields are properly trimmed and not null
    if (cleaned.name) cleaned.name = String(cleaned.name).trim();
    if (cleaned.description) cleaned.description = String(cleaned.description).trim();
    if (cleaned.status) cleaned.status = String(cleaned.status).trim();
    if (cleaned.category) cleaned.category = String(cleaned.category).trim();
  }

  if (tableName === 'transactions') {
    // Ensure all numeric fields are valid
    ['subtotal', 'total_amount', 'tax_amount', 'tip_amount'].forEach(field => {
      if (isNaN(parseFloat(cleaned[field]))) {
        cleaned[field] = 0;
      } else {
        cleaned[field] = parseFloat(cleaned[field]);
      }
    });
    
    // Remove fields that don't exist in the database schema
    const allowedTransactionFields = [
      'id', 'customer_id', 'staff_id', 'booking_id', 'transaction_type', 
      'transaction_date', 'subtotal', 'tax_amount', 'tip_amount', 'total_amount', 
      'status', 'payment_method', 'receipt_number', 'notes',
      'created_at', 'updated_at', 'is_synced'
    ];
    
    Object.keys(cleaned).forEach(key => {
      if (!allowedTransactionFields.includes(key)) {
        console.warn(`Removing unknown field '${key}' from transaction record`);
        delete cleaned[key];
      }
    });
  }

  if (tableName === 'spa_services') {
    // Ensure duration and price are valid numbers
    if (isNaN(parseInt(cleaned.duration))) {
      cleaned.duration = 60;
    } else {
      cleaned.duration = parseInt(cleaned.duration);
    }
    
    if (isNaN(parseFloat(cleaned.price))) {
      cleaned.price = 0;
    } else {
      cleaned.price = parseFloat(cleaned.price);
    }
    
    // Map isActive to status for compatibility
    if (cleaned.isActive !== undefined) {
      cleaned.status = cleaned.isActive ? 'active' : 'inactive';
      delete cleaned.isActive;
    }
  }

  return cleaned;
}

interface SyncResult {
  success: boolean;
  count?: number;
  error?: string;
  details?: any;
}

interface SyncOperation {
  id?: string;
  table: string;
  type: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  device_id: string;
}

let syncInProgress = false;
let suppressToasts = false;

export class DatabaseSync {
  private supabase: any;
  private isAuthenticated = false;
  private currentUser: any = null;

  constructor() {
    if (isSupabaseConfigured()) {
      this.supabase = getSupabaseBrowserClient();
      // this.checkAuth(); // Defer auth check to method calls to prevent SSR errors
    }
  }

  async checkAuth(): Promise<boolean> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      
      if (error) {
        console.error('Auth check failed:', error);
        this.isAuthenticated = false;
        this.currentUser = null;
        return false;
      }

      this.isAuthenticated = !!user;
      this.currentUser = user;
      return this.isAuthenticated;
    } catch (error) {
      console.error('Error checking auth:', error);
      this.isAuthenticated = false;
      this.currentUser = null;
      return false;
    }
  }

  // Full database reset and resync from Supabase
  async resetAndResync(): Promise<SyncResult> {
    console.log('🔄 Starting authentication check...');
    
    if (!await this.checkAuth()) {
      return { 
        success: false, 
        error: "Please sign in with your Supabase account to sync data." 
      };
    }

    if (syncInProgress) {
      return { success: false, error: "Sync already in progress" };
    }

    syncInProgress = true;
    console.log('🔄 Starting full database reset and resync from Supabase...');

    try {
      await initDatabase();
      
      let totalSynced = 0;
      const results: any = {};

      // Clear all local data first
      const { initDatabase: reinitDb } = await import('@/lib/db');
      await reinitDb();

      for (const tableName of SYNC_TABLES) {
        try {
          console.log(`📥 Syncing ${tableName} from Supabase...`);
          
          // Fetch all data from Supabase
          const { data: serverData, error } = await this.supabase
            .from(tableName)
            .select('*')
            .order('created_at', { ascending: true });

          if (error) {
            console.warn(`⚠️ Could not fetch ${tableName}: ${error.message}`);
            results[tableName] = { error: error.message, count: 0 };
            
            // If it's a table not found error, that's okay - the table might not exist yet
            if (error.code === 'PGRST106' || error.message.includes('does not exist')) {
              console.log(`📝 ${tableName}: Table does not exist in Supabase yet`);
              results[tableName] = { count: 0, note: 'Table not found in Supabase' };
            }
            continue;
          }

          // Insert server data into local database
          if (serverData && serverData.length > 0) {
            for (const item of serverData) {
              await createRecord(tableName, {
                ...item,
                is_synced: 1 // Mark as synced since it came from server
              });
            }

            totalSynced += serverData.length;
            results[tableName] = { count: serverData.length };
            console.log(`✅ ${tableName}: ${serverData.length} records synced from Supabase`);
          } else {
            results[tableName] = { count: 0 };
            console.log(`📝 ${tableName}: No data on Supabase server`);
          }

        } catch (error) {
          console.error(`❌ Error syncing ${tableName}:`, error);
          results[tableName] = { 
            error: error instanceof Error ? error.message : 'Unknown error',
            count: 0 
          };
        }
      }

      // Add sample data if no data was synced from server
      if (totalSynced === 0) {
        console.log('📋 No data found on server, adding sample data locally...');
        const { addSampleData } = await import('@/lib/db');
        await addSampleData();
        
        // Count sample data
        const menuItems = await listRecords('menu_items');
        const spaServices = await listRecords('spa_services');
        const sampleCount = menuItems.length + spaServices.length;
        
        console.log(`📋 Sample data added: ${sampleCount} items`);
        results['sample_data'] = { count: sampleCount };
        totalSynced = sampleCount;
      }

      console.log(`🎉 Reset and resync completed: ${totalSynced} total items from Supabase`);

      return {
        success: true,
        count: totalSynced,
        details: {
          message: 'Database reset and resynced from Supabase',
          tables: results,
          user: this.currentUser?.email
        }
      };

    } catch (error) {
      console.error('💥 Reset and resync failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Reset and resync failed'
      };
    } finally {
      syncInProgress = false;
    }
  }

  // Push local changes to Supabase
  async pushLocalChanges(): Promise<SyncResult> {
    console.log('🔄 Checking authentication for push...');
    
    if (!await this.checkAuth()) {
      return { 
        success: false, 
        error: "Please sign in with your Supabase account to push changes." 
      };
    }

    console.log('📤 Pushing local changes to Supabase...');

    try {
      let totalPushed = 0;

      for (const table of SYNC_TABLES) {
        const localRecords = await listRecords(table);
        
        if (localRecords.length > 0) {
          console.log(`Syncing ${localRecords.length} ${table} records to server...`);
          
          // Clean and validate records before syncing
          let cleanedRecords = localRecords.map((record: any) => validateAndCleanRecord(record, table));
          
          // Deduplicate records for menu_items based on name and category
          if (table === 'menu_items') {
            cleanedRecords = cleanedRecords.reduce((acc: any[], current: any) => {
              const existingIndex = acc.findIndex(item => 
                item.name?.toLowerCase() === current.name?.toLowerCase() && 
                item.category === current.category
              );
              
              if (existingIndex === -1) {
                acc.push(current);
              } else {
                // Keep the one with more recent updated_at
                const existing = acc[existingIndex];
                const currentDate = new Date(current.updated_at || current.created_at || 0);
                const existingDate = new Date(existing.updated_at || existing.created_at || 0);
                
                if (currentDate > existingDate) {
                  acc[existingIndex] = current;
                }
              }
              
              return acc;
            }, []);
            
            console.log(`Deduplicated ${localRecords.length} records to ${cleanedRecords.length} for ${table}`);
          }
          
          // Deduplicate records for spa_services based on name and category
          if (table === 'spa_services') {
            cleanedRecords = cleanedRecords.reduce((acc: any[], current: any) => {
              const existingIndex = acc.findIndex(service => 
                service.name?.toLowerCase() === current.name?.toLowerCase() && 
                service.category === current.category
              );
              
              if (existingIndex === -1) {
                acc.push(current);
              } else {
                // Keep the one with more recent updated_at
                const existing = acc[existingIndex];
                const currentDate = new Date(current.updated_at || current.created_at || 0);
                const existingDate = new Date(existing.updated_at || existing.created_at || 0);
                
                if (currentDate > existingDate) {
                  acc[existingIndex] = current;
                }
              }
              
              return acc;
            }, []);
            
            console.log(`Deduplicated ${localRecords.length} records to ${cleanedRecords.length} for ${table}`);
          }
          
          // Deduplicate records for customers based on email or name+phone
          if (table === 'customers') {
            cleanedRecords = cleanedRecords.reduce((acc: any[], current: any) => {
              const existingIndex = acc.findIndex(customer => 
                customer.email?.toLowerCase() === current.email?.toLowerCase() ||
                (customer.name?.toLowerCase() === current.name?.toLowerCase() && 
                 customer.phone === current.phone)
              );
              
              if (existingIndex === -1) {
                acc.push(current);
              } else {
                // Keep the one with more recent updated_at
                const existing = acc[existingIndex];
                const currentDate = new Date(current.updated_at || current.created_at || 0);
                const existingDate = new Date(existing.updated_at || existing.created_at || 0);
                
                if (currentDate > existingDate) {
                  acc[existingIndex] = current;
                }
              }
              
              return acc;
            }, []);
            
            console.log(`Deduplicated ${localRecords.length} records to ${cleanedRecords.length} for ${table}`);
          }
          
          // Deduplicate records for bookings based on customer_name, booking_date, booking_time, and booking_type
          if (table === 'bookings') {
            cleanedRecords = cleanedRecords.reduce((acc: any[], current: any) => {
              const existingIndex = acc.findIndex(booking => 
                booking.customer_name?.toLowerCase() === current.customer_name?.toLowerCase() &&
                booking.booking_date === current.booking_date &&
                booking.booking_time === current.booking_time &&
                booking.booking_type === current.booking_type
              );
              
              if (existingIndex === -1) {
                acc.push(current);
              } else {
                // Keep the one with more recent updated_at
                const existing = acc[existingIndex];
                const currentDate = new Date(current.updated_at || current.created_at || 0);
                const existingDate = new Date(existing.updated_at || existing.created_at || 0);
                
                if (currentDate > existingDate) {
                  acc[existingIndex] = current;
                }
              }
              
              return acc;
            }, []);
            
            console.log(`Deduplicated ${localRecords.length} records to ${cleanedRecords.length} for ${table}`);
          }
          
          // Deduplicate records for transactions based on customer_name, transaction_date, total_amount, and payment_method
          if (table === 'transactions') {
            cleanedRecords = cleanedRecords.reduce((acc: any[], current: any) => {
              const existingIndex = acc.findIndex(transaction => 
                transaction.customer_name?.toLowerCase() === current.customer_name?.toLowerCase() &&
                transaction.transaction_date === current.transaction_date &&
                Math.abs(transaction.total_amount - current.total_amount) < 0.01 && // Allow for small floating point differences
                transaction.payment_method === current.payment_method
              );
              
              if (existingIndex === -1) {
                acc.push(current);
              } else {
                // Keep the one with more recent updated_at
                const existing = acc[existingIndex];
                const currentDate = new Date(current.updated_at || current.created_at || 0);
                const existingDate = new Date(existing.updated_at || existing.created_at || 0);
                
                if (currentDate > existingDate) {
                  acc[existingIndex] = current;
                }
              }
              
              return acc;
            }, []);
            
            console.log(`Deduplicated ${localRecords.length} records to ${cleanedRecords.length} for ${table}`);
          }
          
          // Deduplicate records for transaction_items based on transaction_id, item_name, and price
          if (table === 'transaction_items') {
            cleanedRecords = cleanedRecords.reduce((acc: any[], current: any) => {
              const existingIndex = acc.findIndex(item => 
                item.transaction_id === current.transaction_id &&
                item.item_name?.toLowerCase() === current.item_name?.toLowerCase() &&
                Math.abs(item.price - current.price) < 0.01 // Allow for small floating point differences
              );
              
              if (existingIndex === -1) {
                acc.push(current);
              } else {
                // Keep the one with more recent updated_at or higher quantity if same timestamp
                const existing = acc[existingIndex];
                const currentDate = new Date(current.updated_at || current.created_at || 0);
                const existingDate = new Date(existing.updated_at || existing.created_at || 0);
                
                if (currentDate > existingDate || 
                    (currentDate.getTime() === existingDate.getTime() && current.quantity > existing.quantity)) {
                  acc[existingIndex] = current;
                }
              }
              
              return acc;
            }, []);
            
            console.log(`Deduplicated ${localRecords.length} records to ${cleanedRecords.length} for ${table}`);
          }
          
          try {
            const { data, error } = await this.supabase
              .from(table)
              .upsert(cleanedRecords, { onConflict: 'id' });
            
            if (error) {
              console.error(`Error syncing ${table}:`, {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
                records: cleanedRecords.length
              });
              
              // Try individual record sync to identify problematic records
              console.log(`Attempting individual record sync for ${table}...`);
              const failedRecords = [];
              let successCount = 0;
              
              for (const record of cleanedRecords) {
                try {
                  const { error: singleError } = await this.supabase
                    .from(table)
                    .upsert([record], { onConflict: 'id' });
                  
                  if (singleError) {
                    console.error(`Failed to sync individual record in ${table}:`, {
                      recordId: record.id,
                      recordName: record.name || 'Unknown',
                      recordData: record, // Log the actual record data for debugging
                      error: singleError.message,
                      details: singleError.details,
                      hint: singleError.hint,
                      code: singleError.code
                    });
                    failedRecords.push({ record, error: singleError });
                  } else {
                    successCount++;
                  }
                } catch (singleSyncError) {
                  console.error(`Exception syncing individual record in ${table}:`, {
                    recordId: record.id,
                    recordName: record.name || 'Unknown',
                    recordData: record, // Log the actual record data for debugging
                    error: singleSyncError instanceof Error ? singleSyncError.message : String(singleSyncError)
                  });
                  failedRecords.push({ record, error: singleSyncError });
                }
              }
              
              if (successCount > 0) {
                console.log(`✓ Successfully synced ${successCount}/${cleanedRecords.length} ${table} records`);
                totalPushed += successCount;
              }
              
              if (failedRecords.length > 0) {
                console.warn(`⚠️ Failed to sync ${failedRecords.length}/${cleanedRecords.length} ${table} records`);
                // Don't throw error if some records succeeded
                if (successCount === 0) {
                  throw new Error(`Failed to sync all ${table} records. Check console for detailed errors.`);
                }
              }
            } else {
              console.log(`✓ Successfully synced ${cleanedRecords.length} ${table} records`);
              totalPushed += cleanedRecords.length;
            }
          } catch (syncError) {
            console.error(`Exception during ${table} sync:`, syncError);
            throw new Error(`Failed to sync ${table}: ${syncError instanceof Error ? syncError.message : String(syncError)}`);
          }
        }
      }

      console.log(`📤 Successfully pushed ${totalPushed} records to Supabase`);

      return {
        success: true,
        count: totalPushed
      };

    } catch (error) {
      console.error('💥 Push failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Push failed'
      };
    }
  }

  // Pull latest changes from Supabase
  async pullServerChanges(): Promise<SyncResult> {
    console.log('🔄 Checking authentication for pull...');
    
    if (!await this.checkAuth()) {
      return { 
        success: false, 
        error: "Please sign in with your Supabase account to pull changes." 
      };
    }

    console.log('📥 Pulling latest changes from Supabase...');

    try {
      let totalPulled = 0;

      for (const tableName of SYNC_TABLES) {
        // Get latest data from Supabase
        const { data: serverRecords, error } = await this.supabase
          .from(tableName)
          .select('*')
          .order('updated_at', { ascending: false });

        if (error) {
          console.warn(`⚠️ Could not pull ${tableName}:`, error);
          continue;
        }

        if (serverRecords && serverRecords.length > 0) {
          console.log(`📥 Processing ${serverRecords.length} ${tableName} records from Supabase...`);
          
          for (const serverRecord of serverRecords) {
            try {
              // Check if record exists locally
              const localRecord = await listRecords(tableName, { id: serverRecord.id });
              
              if (localRecord.length === 0) {
                // Create new record locally
                await createRecord(tableName, {
                  ...serverRecord,
                  is_synced: 1
                });
                totalPulled++;
                console.log(`✅ Added new ${tableName}: ${serverRecord.name || serverRecord.id}`);
              } else {
                // Update existing record if server version is newer
                const local = localRecord[0];
                const serverUpdated = new Date(serverRecord.updated_at);
                const localUpdated = new Date(local.updated_at || local.created_at);

                if (serverUpdated > localUpdated) {
                  await updateRecord(tableName, serverRecord.id, {
                    ...serverRecord,
                    is_synced: 1
                  });
                  totalPulled++;
                  console.log(`✅ Updated ${tableName}: ${serverRecord.name || serverRecord.id}`);
                }
              }
            } catch (error) {
              console.error(`❌ Error processing server record for ${tableName}:`, error);
            }
          }
        }
      }

      console.log(`📥 Successfully pulled ${totalPulled} records from Supabase`);

      return {
        success: true,
        count: totalPulled
      };

    } catch (error) {
      console.error('💥 Pull failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Pull failed'
      };
    }
  }

  // Bidirectional sync (push then pull)
  async bidirectionalSync(): Promise<SyncResult> {
    // Verify auth first
    if (!await this.checkAuth()) {
      return { 
        success: false, 
        error: "Authentication required. Please sign in to sync data." 
      };
    }

    if (syncInProgress) {
      return { 
        success: false, 
        error: "Another sync operation is already in progress" 
      };
    }

    syncInProgress = true;
    console.log('🔄 Starting bidirectional sync with Supabase...');

    try {
      // First push local changes
      console.log('📤 Step 1: Pushing local changes...');
      const pushResult = await this.pushLocalChanges();
      
      if (!pushResult.success) {
        throw new Error(`Push failed: ${pushResult.error}`);
      }
      
      // Then pull server changes
      console.log('📥 Step 2: Pulling server changes...');
      const pullResult = await this.pullServerChanges();

      if (!pullResult.success) {
        throw new Error(`Pull failed: ${pullResult.error}`);
      }

      const totalSynced = (pushResult.count || 0) + (pullResult.count || 0);
      console.log(`🎉 Bidirectional sync completed: ${totalSynced} items synced`);
      
      return {
        success: true,
        count: totalSynced,
        details: {
          pushed: pushResult.count || 0,
          pulled: pullResult.count || 0,
          user: this.currentUser?.email
        }
      };

    } catch (error) {
      console.error('💥 Bidirectional sync failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed'
      };
    } finally {
      syncInProgress = false;
    }
  }

  // Get sync status
  getSyncStatus() {
    return {
      isRunning: syncInProgress,
      isAuthenticated: this.isAuthenticated,
      suppressToasts
    };
  }

  // Suppress toasts temporarily
  suppressToasts(duration: number = 30000) {
    suppressToasts = true;
    setTimeout(() => {
      suppressToasts = false;
    }, duration);
  }
}

// Export singleton instance
export const databaseSync = new DatabaseSync();

// Convenience functions
export const resetAndResync = () => databaseSync.resetAndResync();
export const manualSync = () => databaseSync.bidirectionalSync();
export const pushChanges = () => databaseSync.pushLocalChanges();
export const pullChanges = () => databaseSync.pullServerChanges();
export const getSyncStatus = () => databaseSync.getSyncStatus();
export const suppressSyncToasts = (duration?: number) => databaseSync.suppressToasts(duration);