import { serial, text, pgTable, timestamp } from 'drizzle-orm/pg-core';

export const waitlistEntriesTable = pgTable('waitlist_entries', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript type for the table schema
export type WaitlistEntry = typeof waitlistEntriesTable.$inferSelect; // For SELECT operations
export type NewWaitlistEntry = typeof waitlistEntriesTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { waitlistEntries: waitlistEntriesTable };