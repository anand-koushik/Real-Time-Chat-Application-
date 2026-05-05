import { createClient } from "redis";
import { config } from "dotenv";

config();

export const redisClient = createClient({
  url: process.env.REDIS_URL,
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log("Redis connected");
  } catch (err) {
    console.log("Error in Redis connect", err);
  }
};
