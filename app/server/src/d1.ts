/**
 * The slice of the D1 API this server actually calls.
 *
 * Deliberately not the full `@cloudflare/workers-types` D1Database shape --
 * that interface carries a dozen methods (dump, session, exec, withSession...)
 * this code never touches. A narrow interface here means the in-memory fake
 * used in tests only has to implement four methods to stand in for the real
 * binding, and the real Worker's DB binding satisfies this structurally with
 * no adapter needed.
 */
export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<unknown[]>;
}
