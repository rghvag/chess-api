import mongoose from "mongoose";

export const connectMongo = async () => {
  try {
    const dbURI = process.env.DB_URI;
    if (!dbURI) {
      throw new Error("DB_URI is not defined in environment variables");
    }
    await mongoose.connect(dbURI, {
      dbName: process.env?.DB_NAME || "chess",
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB error:", err);
    process.exit(1);
  }
};
