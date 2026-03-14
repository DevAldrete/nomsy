import { test, expect } from "bun:test";
import mongoose from "mongoose";
import { connectDb } from "./db";

const TEST_MONGO_URI =
  process.env.TEST_MONGO_URI ||
  "mongodb://admin:secretpassword@localhost:27017/nomsydb_test?authSource=admin";

export async function connectTestDB(): Promise<typeof mongoose> {
  return mongoose.connect(TEST_MONGO_URI);
}

export async function disconnectTestDB(): Promise<void> {
  await mongoose.connection.close();
}

test("connectDb is a function", () => {
  expect(typeof connectDb).toBe("function");
});
