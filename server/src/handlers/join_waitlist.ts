import { db } from '../db';
import { waitlistEntriesTable } from '../db/schema';
import { type JoinWaitlistInput, type WaitlistConfirmation } from '../schema';
import { eq } from 'drizzle-orm';

export const joinWaitlist = async (input: JoinWaitlistInput): Promise<WaitlistConfirmation> => {
  try {
    // Check if email already exists in the waitlist
    const existingEntry = await db.select()
      .from(waitlistEntriesTable)
      .where(eq(waitlistEntriesTable.email, input.email))
      .limit(1)
      .execute();

    // If email already exists, return success but indicate they're already registered
    if (existingEntry.length > 0) {
      return {
        success: true,
        message: `You're already on our waitlist! We'll notify you at ${input.email} when we launch.`,
        entry: {
          id: existingEntry[0].id,
          name: existingEntry[0].name,
          email: existingEntry[0].email,
          created_at: existingEntry[0].created_at
        }
      };
    }

    // Insert new waitlist entry
    const result = await db.insert(waitlistEntriesTable)
      .values({
        name: input.name,
        email: input.email
      })
      .returning()
      .execute();

    const newEntry = result[0];

    return {
      success: true,
      message: `Thank you ${input.name}! You've been added to our waitlist. We'll notify you at ${input.email} when we launch.`,
      entry: {
        id: newEntry.id,
        name: newEntry.name,
        email: newEntry.email,
        created_at: newEntry.created_at
      }
    };
  } catch (error) {
    console.error('Waitlist registration failed:', error);
    throw error;
  }
};