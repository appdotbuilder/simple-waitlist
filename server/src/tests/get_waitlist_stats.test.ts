import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { waitlistEntriesTable } from '../db/schema';
import { getWaitlistStats } from '../handlers/get_waitlist_stats';

describe('getWaitlistStats', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return zero stats for empty waitlist', async () => {
    const result = await getWaitlistStats();

    expect(result.totalEntries).toEqual(0);
    expect(result.latestEntries).toEqual([]);
  });

  it('should return correct count for single entry', async () => {
    // Create a single waitlist entry
    await db.insert(waitlistEntriesTable)
      .values({
        name: 'John Doe',
        email: 'john@example.com'
      })
      .execute();

    const result = await getWaitlistStats();

    expect(result.totalEntries).toEqual(1);
    expect(result.latestEntries).toHaveLength(1);
    expect(result.latestEntries[0].name).toEqual('John Doe');
    expect(result.latestEntries[0].email).toEqual('john@example.com');
    expect(result.latestEntries[0].id).toBeDefined();
    expect(result.latestEntries[0].created_at).toBeInstanceOf(Date);
  });

  it('should return correct stats for multiple entries', async () => {
    // Create multiple waitlist entries
    const entries = [
      { name: 'Alice Smith', email: 'alice@example.com' },
      { name: 'Bob Johnson', email: 'bob@example.com' },
      { name: 'Charlie Brown', email: 'charlie@example.com' }
    ];

    for (const entry of entries) {
      await db.insert(waitlistEntriesTable)
        .values(entry)
        .execute();
      // Add small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const result = await getWaitlistStats();

    expect(result.totalEntries).toEqual(3);
    expect(result.latestEntries).toHaveLength(3);

    // Verify entries are ordered by creation date (newest first)
    const timestamps = result.latestEntries.map(entry => entry.created_at.getTime());
    for (let i = 0; i < timestamps.length - 1; i++) {
      expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i + 1]);
    }

    // Verify all expected entries are present
    const names = result.latestEntries.map(entry => entry.name);
    expect(names).toContain('Alice Smith');
    expect(names).toContain('Bob Johnson');
    expect(names).toContain('Charlie Brown');
  });

  it('should limit latest entries to 10', async () => {
    // Create 15 waitlist entries
    const entries = Array.from({ length: 15 }, (_, i) => ({
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`
    }));

    for (const entry of entries) {
      await db.insert(waitlistEntriesTable)
        .values(entry)
        .execute();
      // Add small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 5));
    }

    const result = await getWaitlistStats();

    expect(result.totalEntries).toEqual(15);
    expect(result.latestEntries).toHaveLength(10);

    // Verify we get the most recent 10 entries
    const names = result.latestEntries.map(entry => entry.name);
    expect(names).toContain('User 15'); // Most recent
    expect(names).toContain('User 14');
    expect(names).toContain('User 6');  // 10th most recent
    expect(names).not.toContain('User 5'); // Should not include older entries
  });

  it('should handle entries with same timestamp correctly', async () => {
    // Create entries with potentially same timestamp
    const entries = [
      { name: 'Test User 1', email: 'test1@example.com' },
      { name: 'Test User 2', email: 'test2@example.com' },
      { name: 'Test User 3', email: 'test3@example.com' }
    ];

    // Insert all at once to potentially get same timestamp
    await db.insert(waitlistEntriesTable)
      .values(entries)
      .execute();

    const result = await getWaitlistStats();

    expect(result.totalEntries).toEqual(3);
    expect(result.latestEntries).toHaveLength(3);

    // All entries should be returned
    const emails = result.latestEntries.map(entry => entry.email);
    expect(emails).toContain('test1@example.com');
    expect(emails).toContain('test2@example.com');
    expect(emails).toContain('test3@example.com');

    // All should have valid timestamps
    result.latestEntries.forEach(entry => {
      expect(entry.created_at).toBeInstanceOf(Date);
      expect(entry.id).toBeGreaterThan(0);
    });
  });
});