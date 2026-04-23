import { supabase } from './supabase';
import type { Database } from './database.types';

/**
 * Database Query Helper - Perform direct database queries
 * Useful for testing, debugging, and batch operations
 */

type TableName = keyof Database['public']['Tables'];

/**
 * Execute a SELECT query
 */
export async function querySelect<T extends TableName>(
  tableName: T,
  options?: {
    filter?: Record<string, any>;
    limit?: number;
    offset?: number;
    orderBy?: string;
    ascending?: boolean;
  }
) {
  let query = supabase.from(tableName).select('*');

  if (options?.filter) {
    Object.entries(options.filter).forEach(([key, value]) => {
      if (value !== undefined) {
        (query as any) = (query as any).eq(key, value);
      }
    });
  }

  if (options?.limit) {
    (query as any) = (query as any).limit(options.limit);
  }

  if (options?.offset) {
    (query as any) = (query as any).range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  if (options?.orderBy) {
    (query as any) = (query as any).order(options.orderBy, {
      ascending: options.ascending !== false,
    });
  }

  const { data, error } = await (query as any);

  if (error) {
    console.error(`Error querying ${tableName}:`, error);
    throw error;
  }

  return data;
}

/**
 * Get a single record by ID
 */
export async function queryGetById<T extends TableName>(tableName: T, id: string) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching ${tableName} with id ${id}:`, error);
    return null;
  }

  return data;
}

/**
 * Count records in a table
 */
export async function queryCount<T extends TableName>(
  tableName: T,
  filter?: Record<string, any>
) {
  let query = supabase.from(tableName).select('*', { count: 'exact', head: true });

  if (filter) {
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined) {
        (query as any) = (query as any).eq(key, value);
      }
    });
  }

  const { count, error } = await (query as any);

  if (error) {
    console.error(`Error counting ${tableName}:`, error);
    throw error;
  }

  return count ?? 0;
}

/**
 * Insert a record
 */
export async function queryInsert<T extends TableName>(
  tableName: T,
  data: any
) {
  const { data: result, error } = await supabase.from(tableName).insert(data).select();

  if (error) {
    console.error(`Error inserting into ${tableName}:`, error);
    throw error;
  }

  return result;
}

/**
 * Insert multiple records
 */
export async function queryInsertBatch<T extends TableName>(
  tableName: T,
  dataArray: any[]
) {
  const { data, error } = await supabase.from(tableName).insert(dataArray).select();

  if (error) {
    console.error(`Error batch inserting into ${tableName}:`, error);
    throw error;
  }

  return data;
}

/**
 * Update a record
 */
export async function queryUpdate<T extends TableName>(
  tableName: T,
  id: string,
  updates: Partial<any>
) {
  const { data, error } = await supabase
    .from(tableName)
    .update(updates)
    .eq('id', id)
    .select();

  if (error) {
    console.error(`Error updating ${tableName}:`, error);
    throw error;
  }

  return data;
}

/**
 * Delete a record
 */
export async function queryDelete<T extends TableName>(tableName: T, id: string) {
  const { error } = await supabase.from(tableName).delete().eq('id', id);

  if (error) {
    console.error(`Error deleting from ${tableName}:`, error);
    throw error;
  }

  return true;
}

/**
 * Delete multiple records
 */
export async function queryDeleteBatch<T extends TableName>(
  tableName: T,
  filter: Record<string, any>
) {
  let query = supabase.from(tableName).delete();

  Object.entries(filter).forEach(([key, value]) => {
    if (value !== undefined) {
      (query as any) = (query as any).eq(key, value);
    }
  });

  const { error } = await (query as any);

  if (error) {
    console.error(`Error batch deleting from ${tableName}:`, error);
    throw error;
  }

  return true;
}

/**
 * Clear all data from a table (use with caution!)
 */
export async function queryClearTable<T extends TableName>(tableName: T) {
  const { error } = await supabase.from(tableName).delete().neq('id', '');

  if (error) {
    console.error(`Error clearing ${tableName}:`, error);
    throw error;
  }

  console.warn(`⚠️ Cleared all data from ${tableName}`);
  return true;
}

/**
 * Get database statistics
 */
export async function queryDatabaseStats() {
  const tables: TableName[] = [
    'weeks',
    'tasks',
    'brain_dump',
    'pinned_tasks',
    'user_settings',
    'ai_settings',
    'ai_keys',
  ];

  const stats: Record<string, number> = {};

  for (const table of tables) {
    try {
      const count = await queryCount(table);
      stats[table] = count;
    } catch (error) {
      stats[table] = 0;
    }
  }

  return stats;
}

/**
 * Print database statistics
 */
export async function printDatabaseStats() {
  const stats = await queryDatabaseStats();

  console.log('\n📊 Database Statistics:');
  Object.entries(stats).forEach(([table, count]) => {
    console.log(`  ${table}: ${count} records`);
  });
  console.log('');
}

/**
 * Debug helper - print raw query result
 */
export function debugLog(label: string, data: any) {
  console.log(`\n[DEBUG] ${label}:`);
  console.log(JSON.stringify(data, null, 2));
  console.log('');
}
