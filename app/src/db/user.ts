import { eq } from 'drizzle-orm';
import { getDrizzle, initDb } from './client';
import { users } from './schema';

// This is a local-first, single-user app — exactly one person per install
// (PRODUCT.md §Operating Context). There is no multi-user or auth flow, so a
// fixed, well-known id replaces the id-generation a hosted app would need.
export const LOCAL_USER_ID = 'local-user';

export type User = typeof users.$inferSelect;

/**
 * Returns the single local user row, lazily creating it on first call — the
 * same idempotent pattern seedExercises() uses for the exercise table
 * (seed-exercises.ts). `onConflictDoNothing` makes concurrent first calls
 * (e.g. React StrictMode's double effect) a no-op race rather than a
 * UNIQUE-constraint crash.
 */
export async function getUser(): Promise<User> {
  // Open the store before asking it anything. Callers mount at unpredictable
  // times — a consent gate on a deep-linked route renders before App's boot
  // resolves — and getDrizzle() throws until init completes. Making every UI
  // component remember to await the boot is a rule that gets forgotten once;
  // owning it here means every caller is correct by default. initDb() caches
  // its in-flight promise, so this is a no-op after the first call.
  await initDb();
  const db = getDrizzle();
  const existing = await db.select().from(users).where(eq(users.id, LOCAL_USER_ID)).get();
  if (existing) return existing;

  await db
    .insert(users)
    .values({ id: LOCAL_USER_ID, updatedAt: new Date().toISOString() })
    .onConflictDoNothing()
    .run();

  const created = await db.select().from(users).where(eq(users.id, LOCAL_USER_ID)).get();
  if (!created) throw new Error('failed to create the local user row');
  return created;
}

/** GR-5: `consentedAt !== null` is the entire gate — no logging before this is set. */
export function hasConsented(user: User): boolean {
  return user.consentedAt !== null;
}

/**
 * Records explicit, separate consent (GR-5/FR-ONB-3) by stamping
 * `consentedAt` with the current time and persisting it. Ensures the row
 * exists first so this works even if `getUser()` was never called.
 */
export async function recordConsent(): Promise<User> {
  await getUser();
  const db = getDrizzle();
  const now = new Date().toISOString();
  await db.update(users).set({ consentedAt: now, updatedAt: now }).where(eq(users.id, LOCAL_USER_ID)).run();
  return getUser();
}
