import { createClient } from "redis";
import ENV from "./env.js";

const redis = createClient({
  username: ENV.REDIS_USERNAME,
  password: ENV.REDIS_PASSWORD,
  database: Number(ENV.REDIS_DATABASE) || 0,
  socket: {
    host: ENV.REDIS_HOST,
    port: ENV.REDIS_PORT,
    tls: false,
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
