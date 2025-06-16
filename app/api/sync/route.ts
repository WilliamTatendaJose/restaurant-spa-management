import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { operations, clientTimestamp } = await request.json();
    
    if (!operations || !Array.isArray(operations)) {
      return NextResponse.json({ error: 'Invalid operations format' }, { status: 400 });
    }

    const results = [];
    const conflicts = [];

    // Process operations in batches
    for (const operation of operations) {
      try {
        const result = await processOperation(supabase, operation, user.id);
        results.push({
          id: operation.id,
          status: 'success',
          data: result
        });
      } catch (error) {
        if (error instanceof ConflictError) {
          conflicts.push({
            id: operation.id,
            type: 'conflict',
            clientData: operation.data,
            serverData: error.serverData,
            lastModified: error.lastModified
          });
        } else {
          results.push({
            id: operation.id,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    return NextResponse.json({
      results,
      conflicts,
      serverTimestamp: new Date().toISOString(),
      processed: results.length,
      conflicted: conflicts.length
    });

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const lastSync = url.searchParams.get('lastSync');
    const tables = url.searchParams.get('tables')?.split(',') || ['transactions', 'customers', 'bookings'];

    const changes = {};

    for (const table of tables) {
      try {
        let query = supabase.from(table).select('*');
        
        if (lastSync) {
          query = query.gte('updated_at', lastSync);
        }

        const { data, error } = await query.order('updated_at', { ascending: false });
        
        if (error) throw error;
        
        changes[table] = data || [];
      } catch (error) {
        console.error(`Error fetching ${table}:`, error);
        changes[table] = [];
      }
    }

    return NextResponse.json({
      changes,
      serverTimestamp: new Date().toISOString(),
      tablesChecked: tables
    });

  } catch (error) {
    console.error('Sync fetch error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

class ConflictError extends Error {
  constructor(
    message: string,
    public serverData: any,
    public lastModified: string
  ) {
    super(message);
    this.name = 'ConflictError';
  }
}

async function processOperation(supabase: any, operation: any, userId: string) {
  const { type, table, data, id, clientTimestamp } = operation;

  // Validate table access
  const allowedTables = ['transactions', 'customers', 'bookings', 'spa_services', 'menu_items', 'inventory'];
  if (!allowedTables.includes(table)) {
    throw new Error(`Table ${table} not allowed`);
  }

  switch (type) {
    case 'create':
      return await handleCreate(supabase, table, data, userId);
    
    case 'update':
      return await handleUpdate(supabase, table, data, id, clientTimestamp, userId);
    
    case 'delete':
      return await handleDelete(supabase, table, id, userId);
    
    default:
      throw new Error(`Unknown operation type: ${type}`);
  }
}

async function handleCreate(supabase: any, table: string, data: any, userId: string) {
  // Add audit fields
  const recordData = {
    ...data,
    created_by: userId,
    updated_by: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data: result, error } = await supabase
    .from(table)
    .insert(recordData)
    .select()
    .single();

  if (error) throw error;
  return result;
}

async function handleUpdate(supabase: any, table: string, data: any, id: string, clientTimestamp: string, userId: string) {
  // Check for conflicts
  const { data: existing, error: fetchError } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;
  if (!existing) throw new Error('Record not found');

  // Compare timestamps for conflict detection
  if (clientTimestamp && existing.updated_at > clientTimestamp) {
    throw new ConflictError(
      'Data conflict detected',
      existing,
      existing.updated_at
    );
  }

  // Update with audit fields
  const updateData = {
    ...data,
    updated_by: userId,
    updated_at: new Date().toISOString()
  };

  const { data: result, error } = await supabase
    .from(table)
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return result;
}

async function handleDelete(supabase: any, table: string, id: string, userId: string) {
  // Soft delete by default
  const { data: result, error } = await supabase
    .from(table)
    .update({
      deleted: true,
      deleted_by: userId,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return result;
}
