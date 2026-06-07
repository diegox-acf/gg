import "server-only";
import Redis from "ioredis";

// Single shared ioredis connection for the BFF. In dev, Next's HMR re-evaluates
// modules, so we stash the client on globalThis to avoid leaking connections.
const globalForRedis = globalThis as unknown as { ggRedis?: Redis };

export const redis: Redis =
  globalForRedis.ggRedis ??
  new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    lazyConnect: false,
    maxRetriesPerRequest: 2,
  });

if (process.env.NODE_ENV !== "production") globalForRedis.ggRedis = redis;
