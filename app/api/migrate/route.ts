import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// Define the database schema - focusing on the required columns that are missing
const tableSchemas = {
  bookings: `
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_email TEXT,
    booking_date DATE NOT NULL,
    booking_time TIME,
    service TEXT,
    staff TEXT,
    party_size TEXT,
    notes TEXT,
    booking_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    amount NUMERIC(10, 2),
    customer_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_synced BOOLEAN DEFAULT false
  `,
  inventory: `
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit TEXT,
    reorder_level INTEGER,
    last_updated DATE,
    is_available BOOLEAN DEFAULT true, 
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_synced BOOLEAN DEFAULT false
  `,
  customers: `
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    visits INTEGER DEFAULT 0,
    last_visit DATE,
    customer_type TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_synced BOOLEAN DEFAULT false
  `,
  transactions: `
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT,
    customer_id UUID,
    transaction_date DATE NOT NULL,
    transaction_time TIME,
    transaction_type TEXT NOT NULL,
    staff_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    payment_method TEXT,
    total_amount NUMERIC(10, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_synced BOOLEAN DEFAULT false
  `,
  transaction_items: `
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL,
    item_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price NUMERIC(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_synced BOOLEAN DEFAULT false
  `,
  staff: `
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    position TEXT,
    department TEXT,
    hire_date DATE,
    status TEXT DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_synced BOOLEAN DEFAULT false
  `,
  spa_services: `
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    duration INTEGER,
    price NUMERIC(10, 2),
    category TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_synced BOOLEAN DEFAULT false
  `,
  menu_items: `
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    category TEXT,
    preparation_time INTEGER,
    ingredients TEXT,
    allergens TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_synced BOOLEAN DEFAULT false
  `,
  business_settings: `
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    tax_rate NUMERIC(5, 2) DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_synced BOOLEAN DEFAULT false
  `,
  general_settings: `
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key TEXT NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_synced BOOLEAN DEFAULT false
  `,
  sync_log: `
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id TEXT NOT NULL,
    sync_type TEXT NOT NULL,
    records_count INTEGER DEFAULT 0,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  `,
};

// Add explicit function to add specific missing columns
async function addMissingColumnsIfNeeded(supabase: any) {
  const specificFixes = [
    // Add missing columns that were identified in the error messages
    {
      table: 'bookings',
      column: 'customer_id',
      dataType: 'UUID',
    },
    {
      table: 'inventory',
      column: 'is_available',
      dataType: 'BOOLEAN DEFAULT true',
    },
    // Make sure id columns are properly set up with UUID defaults
    {
      table: 'spa_services',
      column: 'id',
      dataType: 'UUID PRIMARY KEY DEFAULT uuid_generate_v4()',
      isPrimaryKey: true,
    },
    {
      table: 'inventory',
      column: 'id',
      dataType: 'UUID PRIMARY KEY DEFAULT uuid_generate_v4()',
      isPrimaryKey: true,
    },
    {
      table: 'customers',
      column: 'id',
      dataType: 'UUID PRIMARY KEY DEFAULT uuid_generate_v4()',
      isPrimaryKey: true,
    },
    {
      table: 'staff',
      column: 'id',
      dataType: 'UUID PRIMARY KEY DEFAULT uuid_generate_v4()',
      isPrimaryKey: true,
    },
  ];

  const results = [];

  for (const fix of specificFixes) {
    try {
      // Check if the column exists
      const { data: columns } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', fix.table)
        .eq('column_name', fix.column)
        .eq('table_schema', 'public');

      if (!columns || columns.length === 0) {
        // Column doesn't exist, add it
        let alterQuery;

        if (fix.isPrimaryKey) {
          // For primary key columns, we need to handle them differently
          // First check if table exists
          const { data: tables } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_name', fix.table)
            .eq('table_schema', 'public');

          if (tables && tables.length > 0) {
            // Table exists but ID column might be wrong - try to recreate with proper UUID defaults
            alterQuery = `
              DO $$
              BEGIN
                -- Drop primary key constraint if it exists
                IF EXISTS (
                  SELECT 1 FROM information_schema.table_constraints 
                  WHERE table_name = '${fix.table}' 
                  AND table_schema = 'public'
                  AND constraint_type = 'PRIMARY KEY'
                ) THEN
                  EXECUTE 'ALTER TABLE ${fix.table} DROP CONSTRAINT IF EXISTS ${fix.table}_pkey';
                END IF;
                
                -- Modify ID column to be UUID with default
                IF EXISTS (
                  SELECT 1 FROM information_schema.columns 
                  WHERE table_name = '${fix.table}' 
                  AND column_name = 'id'
                  AND table_schema = 'public'
                ) THEN
                  EXECUTE 'ALTER TABLE ${fix.table} ALTER COLUMN id TYPE UUID USING (uuid_generate_v4())';
                  EXECUTE 'ALTER TABLE ${fix.table} ALTER COLUMN id SET DEFAULT uuid_generate_v4()';
                  EXECUTE 'ALTER TABLE ${fix.table} ADD PRIMARY KEY (id)';
                ELSE
                  EXECUTE 'ALTER TABLE ${fix.table} ADD COLUMN id UUID PRIMARY KEY DEFAULT uuid_generate_v4()';
                END IF;
              END $$;
            `;
          } else {
            // Table doesn't exist, we'll create it in the main migration process
            continue;
          }
        } else {
          // For regular columns
          alterQuery = `ALTER TABLE ${fix.table} ADD COLUMN IF NOT EXISTS ${fix.column} ${fix.dataType}`;
        }

        // Execute the alter query
        const { error } = await supabase.rpc('exec', { query: alterQuery });

        if (error) {
          results.push(
            `Error adding column ${fix.column} to ${fix.table}: ${error.message}`
          );
        } else {
          results.push(
            `Successfully added column ${fix.column} to ${fix.table}`
          );
        }
      }
    } catch (error) {
      results.push(
        `Error processing ${fix.table}.${fix.column}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return results;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const createTables =
      request.nextUrl.searchParams.get('createTables') === 'true';

    // First, enable UUID extension if not already enabled
    try {
      const { error } = await supabase.rpc('create_uuid_extension');
      if (error) {
        console.log('UUID extension may already exist:', error.message);
      }
    } catch (error) {
      console.log(
        'Error creating UUID extension:',
        error instanceof Error ? error.message : String(error)
      );
      // Continue with migration even if this fails
    }

    const errors = [];
    const createdTables = [];
    const updatedTables: string[] = [];

    // First run specific fixes for the reported missing columns
    const specificFixResults = await addMissingColumnsIfNeeded(supabase);

    // Process each table
    for (const [tableName, schema] of Object.entries(tableSchemas)) {
      try {
        // Check if the table exists
        const { error: checkError, data: checkData } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_name', tableName)
          .eq('table_schema', 'public');

        const tableExists = checkData && checkData.length > 0;

        if (!tableExists || createTables) {
          // Table doesn't exist, create it
          const createQuery = `CREATE TABLE IF NOT EXISTS ${tableName} (${schema})`;
          try {
            const { error: createError } = await supabase.rpc('exec', {
              query: createQuery,
            });

            if (createError) {
              errors.push(
                `Error creating table ${tableName}: ${createError.message}`
              );
            } else {
              createdTables.push(tableName);
            }
          } catch (error) {
            errors.push(
              `Error creating table ${tableName}: ${error instanceof Error ? error.message : String(error)}`
            );
          }
        } else {
          // Table exists, check for missing columns
          for (const columnDef of schema.split(',')) {
            if (columnDef.trim()) {
              const columnName = columnDef.trim().split(' ')[0];

              // Skip primary key constraint
              if (columnName === 'PRIMARY') continue;

              // Check if column exists
              const { error: colCheckError, data: colCheckData } =
                await supabase
                  .from('information_schema.columns')
                  .select('column_name')
                  .eq('table_name', tableName)
                  .eq('column_name', columnName)
                  .eq('table_schema', 'public');

              if (!colCheckData || colCheckData.length === 0) {
                // Column doesn't exist, add it
                const dataType = columnDef
                  .trim()
                  .substring(columnName.length)
                  .trim();
                const alterQuery = `ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${columnName} ${dataType}`;

                try {
                  const { error: alterError } = await supabase.rpc('exec', {
                    query: alterQuery,
                  });

                  if (alterError) {
                    errors.push(
                      `Error adding column ${columnName} to ${tableName}: ${alterError.message}`
                    );
                  } else {
                    if (!updatedTables.includes(tableName)) {
                      updatedTables.push(tableName);
                    }
                  }
                } catch (error) {
                  errors.push(
                    `Error adding column ${columnName} to ${tableName}: ${error instanceof Error ? error.message : String(error)}`
                  );
                }
              }
            }
          }
        }
      } catch (error) {
        errors.push(
          `Error processing table ${tableName}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // Create RPC function for executing arbitrary SQL if it doesn't exist
    try {
      await supabase.rpc('exec', { query: 'SELECT 1' });
    } catch (error) {
      // The function doesn't exist, create it
      try {
        const { error: createFnError } = await supabase.rpc(
          'create_exec_function'
        );

        if (createFnError) {
          // Try to create the function directly
          const createFunctionQuery = `
            CREATE OR REPLACE FUNCTION exec(query text) RETURNS void AS $$
            BEGIN
              EXECUTE query;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;
          `;

          try {
            const { error: execFnError } = await supabase.rpc('exec', {
              query: createFunctionQuery,
            });

            if (execFnError) {
              errors.push(
                `Error creating exec function: ${execFnError.message}`
              );
            }
          } catch (error) {
            errors.push(
              `Error creating exec function: ${error instanceof Error ? error.message : String(error)}`
            );
          }
        }
      } catch (error) {
        errors.push(
          `Error creating exec function: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // Create RPC function for enabling UUID extension if it doesn't exist
    try {
      await supabase.rpc('create_uuid_extension');
    } catch (error) {
      // The function doesn't exist, create it
      const createUuidFunctionQuery = `
        CREATE OR REPLACE FUNCTION create_uuid_extension() RETURNS void AS $$
        BEGIN
          CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `;

      try {
        const { error: uuidFnError } = await supabase.rpc('exec', {
          query: createUuidFunctionQuery,
        });

        if (uuidFnError) {
          errors.push(
            `Error creating UUID extension function: ${uuidFnError.message}`
          );
        }
      } catch (error) {
        errors.push(
          `Error creating UUID extension function: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // Add reference to specific fixes
    const specificFixMessages = specificFixResults.filter((msg) =>
      msg.includes('Successfully')
    );
    if (specificFixMessages.length > 0) {
      updatedTables.push('Applied specific fixes to missing columns');
    }

    return NextResponse.json({
      success: errors.length === 0,
      message:
        errors.length === 0
          ? `Migration completed: Created ${createdTables.length} tables, updated ${updatedTables.length} tables.`
          : 'Migration completed with errors',
      createdTables,
      updatedTables,
      specificFixes: specificFixResults,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error occurred during migration',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const results = [];

    for (const tableName of Object.keys(tableSchemas)) {
      // Check if the table exists
      const { error: checkError, data: checkData } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', tableName)
        .eq('table_schema', 'public');

      const tableExists = checkData && checkData.length > 0;

      if (!tableExists) {
        results.push(`Table ${tableName} does not exist`);
      } else {
        results.push(`Table ${tableName} exists`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database schema migration complete',
      results,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
