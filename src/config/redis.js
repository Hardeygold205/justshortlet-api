import { createClient } from "redis";
import ENV from "./env.js";

const redis = createClient({
  url: `redis://${ENV.REDIS_HOST || "127.0.0.1"}:${ENV.REDIS_PORT || 6379}`,
  password: ENV.REDIS_PASSWORD || undefined,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error("Redis: too many reconnect attempts");
        return new Error("Redis reconnect limit reached");
      }
      return Math.min(retries * 100, 3000);
    },
    connectTimeout: 10_000,
  },
});

redis.on("connect", () => console.log("Redis connected"));
redis.on("error", (err) => console.error("Redis error", err));
redis.on("reconnecting", () => console.warn("Redis reconnecting..."));

await redis.connect();

export default redis;
