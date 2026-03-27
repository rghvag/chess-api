import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";

export const redis = createClient({ url: redisUrl });
export const pub = redis.duplicate();
export const sub = redis.duplicate();

export const connectRedis = async () => {
  if (!redis.isOpen) await redis.connect();
  if (!pub.isOpen) await pub.connect();
  if (!sub.isOpen) await sub.connect();
  console.log("Redis connected");
};
