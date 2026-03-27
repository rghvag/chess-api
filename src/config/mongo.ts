import mongoose from "mongoose";

export const connectMongo = async () => {
  try {
    const dbURI = process.env.DB_URI ?? "mongodb://localhost:27017/chess";
    await mongoose.connect(dbURI, {
      dbName: process.env?.DB_NAME || "chess",
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB error:", err);
    process.exit(1);
  }
};
