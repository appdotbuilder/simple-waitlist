import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { waitlistEntriesTable } from '../db/schema';
import { type JoinWaitlistInput } from '../schema';
import { joinWaitlist } from '../handlers/join_waitlist';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: JoinWaitlistInput = {
  name: 'John Doe',
  email: 'john@example.com'
};

const anotherTestInput: JoinWaitlistInput = {
  name: 'Jane Smith',
  email: 'jane@example.com'
};

describe('joinWaitlist', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully add a new user to the waitlist', async () => {
    const result = await joinWaitlist(testInput);

    // Verify response structure
    expect(result.success).toBe(true);
    expect(result.message).toContain('Thank you John Doe!');
    expect(result.message).toContain('john@example.com');
    expect(result.entry).toBeDefined();
    
    // Verify entry data
    expect(result.entry!.name).toBe('John Doe');
    expect(result.entry!.email).toBe('john@example.com');
    expect(result.entry!.id).toBeDefined();
    expect(result.entry!.created_at).toBeInstanceOf(Date);
  });

  it('should save the entry to the database', async () => {
    const result = await joinWaitlist(testInput);

    // Query database directly to verify entry was saved
    const entries = await db.select()
      .from(waitlistEntriesTable)
      .where(eq(waitlistEntriesTable.id, result.entry!.id))
      .execute();

    expect(entries).toHaveLength(1);
    expect(entries[0].name).toBe('John Doe');
    expect(entries[0].email).toBe('john@example.com');
    expect(entries[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle duplicate email addresses gracefully', async () => {
    // First registration
    const firstResult = await joinWaitlist(testInput);
    expect(firstResult.success).toBe(true);
    expect(firstResult.message).toContain('Thank you John Doe!');

    // Second registration with same email but different name
    const duplicateInput: JoinWaitlistInput = {
      name: 'John Smith', // Different name
      email: 'john@example.com' // Same email
    };

    const secondResult = await joinWaitlist(duplicateInput);
    
    // Should return success but indicate already registered
    expect(secondResult.success).toBe(true);
    expect(secondResult.message).toContain("You're already on our waitlist!");
    expect(secondResult.message).toContain('john@example.com');
    
    // Should return the original entry, not create a new one
    expect(secondResult.entry!.name).toBe('John Doe'); // Original name
    expect(secondResult.entry!.id).toBe(firstResult.entry!.id); // Same ID
  });

  it('should not create duplicate entries in database', async () => {
    // Register same email twice
    await joinWaitlist(testInput);
    await joinWaitlist({ name: 'Different Name', email: 'john@example.com' });

    // Verify only one entry exists in database
    const entries = await db.select()
      .from(waitlistEntriesTable)
      .where(eq(waitlistEntriesTable.email, 'john@example.com'))
      .execute();

    expect(entries).toHaveLength(1);
    expect(entries[0].name).toBe('John Doe'); // Original name preserved
  });

  it('should handle multiple different users correctly', async () => {
    // Register two different users
    const result1 = await joinWaitlist(testInput);
    const result2 = await joinWaitlist(anotherTestInput);

    // Verify both registrations succeeded
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);

    // Verify different IDs
    expect(result1.entry!.id).not.toBe(result2.entry!.id);

    // Verify both entries in database
    const allEntries = await db.select()
      .from(waitlistEntriesTable)
      .execute();

    expect(allEntries).toHaveLength(2);
    
    const emails = allEntries.map(entry => entry.email);
    expect(emails).toContain('john@example.com');
    expect(emails).toContain('jane@example.com');
  });

  it('should handle email case sensitivity correctly', async () => {
    // Register with lowercase email
    const result1 = await joinWaitlist(testInput);
    expect(result1.success).toBe(true);

    // Try to register with uppercase email
    const uppercaseEmailInput: JoinWaitlistInput = {
      name: 'John Upper',
      email: 'JOHN@EXAMPLE.COM'
    };

    const result2 = await joinWaitlist(uppercaseEmailInput);
    
    // Should allow uppercase email as a different entry (case sensitive)
    expect(result2.success).toBe(true);
    expect(result2.message).toContain('Thank you John Upper!');
    expect(result2.entry!.id).not.toBe(result1.entry!.id);

    // Verify both entries exist
    const allEntries = await db.select()
      .from(waitlistEntriesTable)
      .execute();

    expect(allEntries).toHaveLength(2);
  });

  it('should preserve timestamps correctly', async () => {
    const beforeRegistration = new Date();
    
    const result = await joinWaitlist(testInput);
    
    const afterRegistration = new Date();

    expect(result.entry!.created_at).toBeInstanceOf(Date);
    expect(result.entry!.created_at.getTime()).toBeGreaterThanOrEqual(beforeRegistration.getTime());
    expect(result.entry!.created_at.getTime()).toBeLessThanOrEqual(afterRegistration.getTime());
  });
});