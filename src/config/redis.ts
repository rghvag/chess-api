import { createClient } from "redis";

export const redis = createClient({ url: "redis://localhost:6379" });
export const pub = redis.duplicate();
export const sub = redis.duplicate();

export const connectRedis = async () => {
  if (!redis.isOpen) await redis.connect();
  if (!pub.isOpen) await pub.connect();
  if (!sub.isOpen) await sub.connect();
  console.log("Redis connected");
};
