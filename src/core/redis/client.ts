import { createClient } from "redis";
import { AppError } from "@errors/AppError"

import type { RedisClientType } from "redis";

let redis: RedisClientType | null = null;
export const getRedisClient = async (): Promise<RedisClientType> => {
  if (!redis) {
    const redisURL = process.env.REDIS_URL;
    if (!redisURL) {
      throw new AppError("Redis URL is not set");
    }

    redis = createClient({ url: redisURL });
    redis.on("error", (err) => console.error("Redis client error", err));
    await redis.connect();
  }
  return redis;
};
