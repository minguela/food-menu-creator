// Client-side DB access via server API routes (replaces direct Supabase calls)
// All queries go through Nuxt server API routes — no direct DB access from browser

type QueryResult<T = any> = { data: T | null; error: Error | null };

function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  return $fetch<T>(`/api/${path}`, options);
}

// Query builder that proxies to server API routes
class ClientQueryBuilder {
  private table: string;
  private filters: Record<string, any> = {};
  private selectCols: string = '*';
  private orderCol: string | null = null;
  private orderAsc: boolean = true;
  private limitVal: number | null = null;
  private singleMode: 'single' | 'maybeSingle' | null = null;

  constructor(table: string) {
    this.table = table;
  }

  select(cols: string = '*') { this.selectCols = cols; return this; }
  eq(col: string, val: any) { this.filters[col] = val; return this; }
  neq(col: string, val: any) { this.filters[`neq.${col}`] = val; return this; }
  in(col: string, vals: any[]) { this.filters[`in.${col}`] = vals.join(','); return this; }
  order(col: string, opts?: { ascending?: boolean }) { this.orderCol = col; this.orderAsc = opts?.ascending ?? true; return this; }
  limit(n: number) { this.limitVal = n; return this; }
  single() { this.singleMode = 'single'; return this; }
  maybeSingle() { this.singleMode = 'maybeSingle'; return this; }

  // Insert, update, delete — these go through specific API routes
  async insert(data: Record<string, any> | Record<string, any>[]): Promise<QueryResult> {
    try {
      const result = await apiFetch(`db/${this.table}`, { method: 'POST', body: data });
      return { data: result, error: null };
    } catch (err: any) { return { data: null, error: err }; }
  }

  async update(data: Record<string, any>): Promise<QueryResult> {
    try {
      const result = await apiFetch(`db/${this.table}`, { method: 'PUT', body: { ...data, ...this.filters } });
      return { data: result, error: null };
    } catch (err: any) { return { data: null, error: err }; }
  }

  async delete(): Promise<QueryResult> {
    try {
      const result = await apiFetch(`db/${this.table}`, { method: 'DELETE', query: this.filters });
      return { data: result, error: null };
    } catch (err: any) { return { data: null, error: err }; }
  }

  // Select (GET)
  async then<T = any>(resolve: (value: QueryResult<T>) => void, _reject?: any) {
    try {
      const params = new URLSearchParams();
      if (this.selectCols !== '*') params.set('select', this.selectCols);
      Object.entries(this.filters).forEach(([k, v]) => params.set(k, String(v)));
      if (this.orderCol) params.set('order', `${this.orderCol}:${this.orderAsc ? 'asc' : 'desc'}`);
      if (this.limitVal) params.set('limit', String(this.limitVal));
      if (this.singleMode) params.set('single', this.singleMode);

      const result = await apiFetch(`db/${this.table}?${params.toString()}`);
      resolve({ data: result as T, error: null });
    } catch (err: any) {
      resolve({ data: null, error: err });
    }
  }
}

export const useSupabase = () => {
  return {
    from: (table: string) => new ClientQueryBuilder(table),
    // RPC calls
    rpc: async (fn: string, params?: Record<string, any>) => {
      try {
        const result = await apiFetch(`db/rpc/${fn}`, { method: 'POST', body: params });
        return { data: result, error: null };
      } catch (err: any) { return { data: null, error: err }; }
    },
    // Auth stubs (client-side auth handled by separate auth system)
    auth: {
      getSession: async () => {
        try {
          return await apiFetch('auth/session');
        } catch { return { data: { session: null }, error: null }; }
      },
      signInWithPassword: async (creds: { email: string; password: string }) => {
        return apiFetch('auth/login', { method: 'POST', body: creds });
      },
      signUp: async (creds: { email: string; password: string }) => {
        return apiFetch('auth/register', { method: 'POST', body: creds });
      },
      signOut: async () => {
        return apiFetch('auth/logout', { method: 'POST' });
      },
    },
  };
};
