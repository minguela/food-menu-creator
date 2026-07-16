// Neon PostgreSQL client with Supabase-compatible query API
// Replaces @supabase/supabase-js — same API surface, different backend
import { Pool } from 'pg';

let pool: InstanceType<typeof Pool> | null = null;

function getPool(): InstanceType<typeof Pool> {
  if (pool) return pool;
  const url = process.env.NEON_DATABASE_URL || '';
  if (!url) throw new Error('NEON_DATABASE_URL is not set');
  pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false }, max: 10 });
  return pool;
}

// ── Query Builder ──
// Mimics supabase.from("table").select().eq().insert() etc.

interface QueryFilter {
  column: string;
  operator: string;
  value: any;
}

interface QueryOrder {
  column: string;
  ascending: boolean;
}

class QueryBuilder {
  private tableName: string;
  private action: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private columns: string = '*';
  private filters: QueryFilter[] = [];
  private orders: QueryOrder[] = [];
  private limitVal: number | null = null;
  private offsetVal: number | null = null;
  private insertData: Record<string, any> | Record<string, any>[] | null = null;
  private updateData: Record<string, any> | null = null;
  private upsertData: Record<string, any> | Record<string, any>[] | null = null;
  private upsertOnConflict: string | null = null;
  private returnSingle: boolean = false;
  private maybeEmpty: boolean = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns: string = '*') { this.action = 'select'; this.columns = columns; return this; }
  insert(data: Record<string, any> | Record<string, any>[]) { this.action = 'insert'; this.insertData = data; return this; }
  update(data: Record<string, any>) { this.action = 'update'; this.updateData = data; return this; }
  delete() { this.action = 'delete'; return this; }
  upsert(data: Record<string, any> | Record<string, any>[], opts?: { onConflict?: string; ignoreDuplicates?: boolean }) {
    this.action = 'upsert';
    this.upsertData = data;
    this.upsertOnConflict = opts?.onConflict || null;
    this.upsertIgnoreDuplicates = opts?.ignoreDuplicates || false;
    return this;
  }
  private upsertIgnoreDuplicates: boolean = false;

  eq(column: string, value: any) { this.filters.push({ column, operator: '=', value }); return this; }
  neq(column: string, value: any) { this.filters.push({ column, operator: '!=', value }); return this; }
  gt(column: string, value: any) { this.filters.push({ column, operator: '>', value }); return this; }
  gte(column: string, value: any) { this.filters.push({ column, operator: '>=', value }); return this; }
  lt(column: string, value: any) { this.filters.push({ column, operator: '<', value }); return this; }
  lte(column: string, value: any) { this.filters.push({ column, operator: '<=', value }); return this; }
  in(column: string, values: any[]) { this.filters.push({ column, operator: 'IN', value: values }); return this; }
  is(column: string, value: any) {
    if (value === null) this.filters.push({ column, operator: 'IS NULL', value: null });
    else this.filters.push({ column, operator: 'IS NOT NULL', value: null });
    return this;
  }
  ilike(column: string, value: string) { this.filters.push({ column, operator: 'ILIKE', value }); return this; }
  order(column: string, opts?: { ascending?: boolean }) { this.orders.push({ column, ascending: opts?.ascending ?? true }); return this; }
  limit(n: number) { this.limitVal = n; return this; }
  range(start: number, end: number) { this.offsetVal = start; this.limitVal = end - start + 1; return this; }
  single() { this.returnSingle = true; this.maybeEmpty = false; this.limitVal = 1; return this; }
  maybeSingle() { this.returnSingle = true; this.maybeEmpty = true; this.limitVal = 1; return this; }

  // Execute query
  async then<T = any>(resolve: (value: { data: T | null; error: Error | null }) => void, _reject?: any) {
    try {
      const result = await this.execute();
      resolve({ data: result as T, error: null });
    } catch (err: any) {
      resolve({ data: null, error: err });
    }
  }

  private async execute(): Promise<any> {
    const pg = getPool();
    let sql: string;
    let params: any[] = [];
    let paramIndex = 0;

    const param = (val: any): string => {
      paramIndex++;
      params.push(val === undefined ? null : val);
      return `$${paramIndex}`;
    };

    switch (this.action) {
      case 'select': {
        const where = this.buildWhere(params, param);
        const orderBy = this.orders.length
          ? ' ORDER BY ' + this.orders.map(o => `"${o.column}" ${o.ascending ? 'ASC' : 'DESC'}`).join(', ')
          : '';
        const limit = this.limitVal ? ` LIMIT ${this.limitVal}` : '';
        const offset = this.offsetVal ? ` OFFSET ${this.offsetVal}` : '';
        sql = `SELECT ${this.columns} FROM "${this.tableName}"${where}${orderBy}${limit}${offset}`;
        break;
      }
      case 'insert': {
        const data = Array.isArray(this.insertData) ? this.insertData : [this.insertData];
        if (data.length === 0) throw new Error('No data to insert');
        const keys = Object.keys(data[0]);
        const values = data.map(row => `(${keys.map(k => param(row[k])).join(', ')})`).join(', ');
        sql = `INSERT INTO "${this.tableName}" (${keys.map(k => `"${k}"`).join(', ')}) VALUES ${values} RETURNING *`;
        break;
      }
      case 'update': {
        if (!this.updateData) throw new Error('No data to update');
        const setClauses = Object.keys(this.updateData).map(k => `"${k}" = ${param(this.updateData![k])}`).join(', ');
        const where = this.buildWhere(params, param);
        if (!where) throw new Error('UPDATE requires a WHERE clause — use .eq() or similar');
        sql = `UPDATE "${this.tableName}" SET ${setClauses}${where} RETURNING *`;
        break;
      }
      case 'delete': {
        const where = this.buildWhere(params, param);
        if (!where) throw new Error('DELETE requires a WHERE clause');
        sql = `DELETE FROM "${this.tableName}"${where} RETURNING *`;
        break;
      }
      case 'upsert': {
        const data = Array.isArray(this.upsertData) ? this.upsertData : [this.upsertData];
        if (data.length === 0) throw new Error('No data to upsert');
        const keys = Object.keys(data[0]);
        const values = data.map(row => `(${keys.map(k => param(row[k])).join(', ')})`).join(', ');
        const conflict = this.upsertOnConflict ? ` ON CONFLICT (${this.upsertOnConflict})` : '';
        const updateSet = conflict && !this.upsertIgnoreDuplicates
          ? ` DO UPDATE SET ${keys.filter(k => !this.upsertOnConflict?.split(',').map(s => s.trim()).includes(k)).map(k => `"${k}" = EXCLUDED."${k}"`).join(', ')}`
          : ' DO NOTHING';
        sql = `INSERT INTO "${this.tableName}" (${keys.map(k => `"${k}"`).join(', ')}) VALUES ${values}${conflict}${updateSet} RETURNING *`;
        break;
      }
      default:
        throw new Error(`Unknown action: ${this.action}`);
    }

    const result = await pg.query(sql, params);

    if (this.returnSingle) {
      const rows = result.rows;
      if (rows.length === 0) {
        if (this.maybeEmpty) return null;
        throw new Error('No rows returned');
      }
      return rows[0];
    }

    // For insert/update/delete returning *, return the rows
    if (this.action === 'insert' || this.action === 'update' || this.action === 'delete' || this.action === 'upsert') {
      return result.rows;
    }

    return result.rows;
  }

  private buildWhere(params: any[], param: (val: any) => string): string {
    if (this.filters.length === 0) return '';
    const clauses = this.filters.map(f => {
      if (f.operator === 'IN') {
        const vals = (f.value as any[]).map(v => param(v)).join(', ');
        return `"${f.column}" IN (${vals})`;
      }
      if (f.operator === 'IS NULL') return `"${f.column}" IS NULL`;
      if (f.operator === 'IS NOT NULL') return `"${f.column}" IS NOT NULL`;
      return `"${f.column}" ${f.operator} ${param(f.value)}`;
    });
    return ' WHERE ' + clauses.join(' AND ');
  }
}

// ── Exported client (same API as supabase) ──
export const db = {
  from: (table: string) => new QueryBuilder(table),
  // RPC-style function calls (for error_logs etc.)
  rpc: async (fn: string, params?: Record<string, any>) => {
    const pg = getPool();
    const paramList = params
      ? Object.values(params).map((_, i) => `$${i + 1}`).join(', ')
      : '';
    const sql = `SELECT * FROM ${fn}(${paramList})`;
    const values = params ? Object.values(params) : [];
    const result = await pg.query(sql, values);
    return { data: result.rows, error: null };
  },
  // Raw SQL for complex queries
  query: async (sql: string, params?: any[]) => {
    const pg = getPool();
    const result = await pg.query(sql, params || []);
    return { rows: result.rows, rowCount: result.rowCount };
  },
};

export { getPool };
export default db;
