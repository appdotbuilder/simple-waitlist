import { db } from '../db';
import { waitlistEntriesTable } from '../db/schema';
import { count, desc } from 'drizzle-orm';

export interface WaitlistStats {
    totalEntries: number;
    latestEntries: Array<{
        id: number;
        name: string;
        email: string;
        created_at: Date;
    }>;
}

export const getWaitlistStats = async (): Promise<WaitlistStats> => {
  try {
    // Get total count of entries
    const totalResult = await db.select({ count: count() })
      .from(waitlistEntriesTable)
      .execute();

    const totalEntries = totalResult[0].count;

    // Get latest 10 entries, ordered by creation date descending
    const latestEntries = await db.select()
      .from(waitlistEntriesTable)
      .orderBy(desc(waitlistEntriesTable.created_at))
      .limit(10)
      .execute();

    return {
      totalEntries,
      latestEntries
    };
  } catch (error) {
    console.error('Failed to fetch waitlist stats:', error);
    throw error;
  }
};