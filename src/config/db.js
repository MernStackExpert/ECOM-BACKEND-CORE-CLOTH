const { MongoClient } = require("mongodb");
require("dotenv").config();

let dbInstance = null;

const connectDB = async () => {
  try {
    if (dbInstance) return dbInstance;

    const client = new MongoClient(process.env.MONGODB_URI, {
      maxPoolSize: 100,
      serverSelectionTimeoutMS: 5000,
    });

    await client.connect();
    dbInstance = client.db();

    console.log("Database Connection Successful");
    return dbInstance;
  } catch (error) {
    console.error("Database Connection Failed:", error);
    process.exit(1);
  }
};

const getDB = () => {
  if (!dbInstance) {
    throw new Error("Database not initialized");
  }
  return dbInstance;
};

module.exports = { connectDB, getDB };
