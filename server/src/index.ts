import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schema types
import { joinWaitlistInputSchema } from './schema';

// Import handlers
import { joinWaitlist } from './handlers/join_waitlist';
import { getWaitlistStats } from './handlers/get_waitlist_stats';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Join waitlist endpoint - main functionality
  joinWaitlist: publicProcedure
    .input(joinWaitlistInputSchema)
    .mutation(({ input }) => joinWaitlist(input)),

  // Get waitlist statistics - for monitoring/admin purposes
  getWaitlistStats: publicProcedure
    .query(() => getWaitlistStats()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();