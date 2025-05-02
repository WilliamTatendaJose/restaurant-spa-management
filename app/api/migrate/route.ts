import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import type { NextRequest } from "next/server"

// Update the GET function to handle creating all tables

// Find the GET function and update it:
export async function GET(request: NextRequest) {
  try {
    // Create a Supabase client with admin privileges
    const supabase = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "")

    // Check if we should create all tables
    const { searchParams } = new URL(request.url)
    const createTables = searchParams.get("createTables") === "true"

    // Tables that need the is_synced column
    const tables = ["bookings", "inventory", "customers", "transactions", "transaction_items", "staff"]

    // If createTables is true, create all tables
    if (createTables) {
      console.log("Creating all tables...")

      // Create bookings table
      const createBookingsQuery = `
        CREATE TABLE IF NOT EXISTS bookings (
          id UUID PRIMARY KEY,
          customer_name TEXT,
          customer_phone TEXT,
          customer_email TEXT,
          booking_date TEXT,
          booking_time TEXT,
          service TEXT,
          staff TEXT,
          notes TEXT,
          booking_type TEXT,
          status TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          is_synced INTEGER DEFAULT 1
        );
      `

      // Create inventory table
      const createInventoryQuery = `
        CREATE TABLE IF NOT EXISTS inventory (
          id UUID PRIMARY KEY,
          name TEXT,
          category TEXT,
          quantity INTEGER,
          unit TEXT,
          reorder_level INTEGER,
          description TEXT,
          last_updated TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          is_synced INTEGER DEFAULT 1
        );
      `

      // Create customers table
      const createCustomersQuery = `
        CREATE TABLE IF NOT EXISTS customers (
          id UUID PRIMARY KEY,
          name TEXT,
          email TEXT,
          phone TEXT,
          address TEXT,
          customer_type TEXT,
          visits INTEGER DEFAULT 0,
          last_visit TEXT,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          is_synced INTEGER DEFAULT 1
        );
      `

      // Create transactions table
      const createTransactionsQuery = `
        CREATE TABLE IF NOT EXISTS transactions (
          id UUID PRIMARY KEY,
          customer_name TEXT,
          transaction_date TEXT,
          total_amount DECIMAL(10,2),
          payment_method TEXT,
          transaction_type TEXT,
          notes TEXT,
          status TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          is_synced INTEGER DEFAULT 1
        );
      `

      // Create transaction_items table
      const createTransactionItemsQuery = `
        CREATE TABLE IF NOT EXISTS transaction_items (
          id UUID PRIMARY KEY,
          transaction_id UUID,
          item_name TEXT,
          quantity INTEGER,
          price DECIMAL(10,2),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          is_synced INTEGER DEFAULT 1
        );
      `

      // Create staff table
      const createStaffQuery = `
        CREATE TABLE IF NOT EXISTS staff (
          id UUID PRIMARY KEY,
          name TEXT,
          email TEXT,
          phone TEXT,
          role TEXT,
          department TEXT,
          status TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          is_synced INTEGER DEFAULT 1
        );
      `

      // Create sync_log table
      const createSyncLogQuery = `
        CREATE TABLE IF NOT EXISTS sync_log (
          id SERIAL PRIMARY KEY,
          device_id TEXT,
          sync_type TEXT,
          entity_type TEXT,
          entity_id TEXT,
          operation TEXT,
          status TEXT,
          error_message TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `

      // Execute all create table queries
      const queries = [
        createBookingsQuery,
        createInventoryQuery,
        createCustomersQuery,
        createTransactionsQuery,
        createTransactionItemsQuery,
        createStaffQuery,
        createSyncLogQuery,
      ]

      for (const query of queries) {
        const { error } = await supabase.rpc("pgclient", { query })
        if (error) {
          console.error(`Error executing query: ${error.message}`)
        }
      }

      return NextResponse.json({
        success: true,
        message: "All tables created successfully",
      })
    }

    // Add is_synced column to each table if it doesn't exist
    for (const table of tables) {
      // Check if the table exists
      const { data: tableExists, error: tableCheckError } = await supabase
        .from(table)
        .select("*")
        .limit(1)
        .catch(() => ({ data: null, error: { message: `Table ${table} does not exist` } }))

      if (tableCheckError) {
        console.log(`Creating table ${table}...`)

        // Create the table with the required columns
        let createTableQuery = ""

        if (table === "bookings") {
          createTableQuery = `
            CREATE TABLE IF NOT EXISTS bookings (
              id UUID PRIMARY KEY,
              customer_name TEXT,
              customer_phone TEXT,
              customer_email TEXT,
              booking_date TEXT,
              booking_time TEXT,
              service TEXT,
              staff TEXT,
              notes TEXT,
              booking_type TEXT,
              status TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              is_synced INTEGER DEFAULT 1
            );
          `
        } else if (table === "inventory") {
          createTableQuery = `
            CREATE TABLE IF NOT EXISTS inventory (
              id UUID PRIMARY KEY,
              name TEXT,
              category TEXT,
              quantity INTEGER,
              unit TEXT,
              reorder_level INTEGER,
              last_updated TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              is_synced INTEGER DEFAULT 1
            );
          `
        } else if (table === "customers") {
          createTableQuery = `
            CREATE TABLE IF NOT EXISTS customers (
              id UUID PRIMARY KEY,
              name TEXT,
              email TEXT,
              phone TEXT,
              visits INTEGER,
              last_visit TEXT,
              customer_type TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              is_synced INTEGER DEFAULT 1
            );
          `
        } else if (table === "transactions") {
          createTableQuery = `
            CREATE TABLE IF NOT EXISTS transactions (
              id UUID PRIMARY KEY,
              customer_id TEXT,
              total DECIMAL(10,2),
              payment_method TEXT,
              status TEXT,
              transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              is_synced INTEGER DEFAULT 1
            );
          `
        } else if (table === "transaction_items") {
          createTableQuery = `
            CREATE TABLE IF NOT EXISTS transaction_items (
              id UUID PRIMARY KEY,
              transaction_id UUID REFERENCES transactions(id),
              item_name TEXT,
              quantity INTEGER,
              price DECIMAL(10,2),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              is_synced INTEGER DEFAULT 1
            );
          `
        } else if (table === "staff") {
          createTableQuery = `
            CREATE TABLE IF NOT EXISTS staff (
              id UUID PRIMARY KEY,
              name TEXT,
              email TEXT,
              phone TEXT,
              role TEXT,
              status TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              is_synced INTEGER DEFAULT 1
            );
          `
        }

        if (createTableQuery) {
          const { error: createError } = await supabase.rpc("pgclient", { query: createTableQuery })
          if (createError) {
            console.error(`Error creating table ${table}:`, createError)
          } else {
            console.log(`Table ${table} created successfully`)
          }
        }
      } else {
        // Table exists, check if is_synced column exists
        console.log(`Table ${table} exists, checking for is_synced column...`)

        // Add is_synced column if it doesn't exist
        const alterTableQuery = `
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT FROM information_schema.columns 
              WHERE table_name = '${table}' AND column_name = 'is_synced'
            ) THEN
              ALTER TABLE ${table} ADD COLUMN is_synced INTEGER DEFAULT 1;
            END IF;
          END $$;
        `

        const { error: alterError } = await supabase.rpc("pgclient", { query: alterTableQuery })
        if (alterError) {
          console.error(`Error adding is_synced column to ${table}:`, alterError)
        } else {
          console.log(`is_synced column added to ${table} (if it didn't exist)`)
        }
      }
    }

    // Create sync_log table if it doesn't exist
    const syncLogQuery = `
      CREATE TABLE IF NOT EXISTS sync_log (
        id SERIAL PRIMARY KEY,
        device_id TEXT,
        sync_type TEXT,
        entity_type TEXT,
        entity_id TEXT,
        operation TEXT,
        status TEXT,
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    const { error: syncLogError } = await supabase.rpc("pgclient", { query: syncLogQuery })
    if (syncLogError) {
      console.error("Error creating sync_log table:", syncLogError)
    } else {
      console.log("sync_log table created successfully (if it didn't exist)")
    }

    return NextResponse.json({
      success: true,
      message: "Database migration completed successfully",
    })
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 },
    )
  }
}
