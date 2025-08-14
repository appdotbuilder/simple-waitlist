import { z } from 'zod';

// Waitlist entry schema
export const waitlistEntrySchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  created_at: z.coerce.date()
});

export type WaitlistEntry = z.infer<typeof waitlistEntrySchema>;

// Input schema for joining the waitlist
export const joinWaitlistInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required')
});

export type JoinWaitlistInput = z.infer<typeof joinWaitlistInputSchema>;

// Confirmation response schema
export const waitlistConfirmationSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  entry: waitlistEntrySchema.optional()
});

export type WaitlistConfirmation = z.infer<typeof waitlistConfirmationSchema>;