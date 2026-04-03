const { createClient } = require("redis");

const client = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error("Redis: too many reconnect attempts.");
        return new Error("Redis reconnect limit reached");
      }
      return Math.min(retries * 150, 3000);
    },
  },
});

client.on("connect", () => console.log("Redis connected"));
client.on("error", (err) => console.error("Redis error:", err.message));
client.on("reconnecting", () => console.log("Redis reconnecting..."));

const connectRedis = async () => {
  await client.connect();
};

module.exports = { redisClient: client, connectRedis };
