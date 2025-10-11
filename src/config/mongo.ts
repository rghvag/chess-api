import mongoose from "mongoose";

export const connectMongo = async () => {
  try {
    await mongoose.connect(process.env.DB_URI || "mongodb+srv://raghava2122_db_user:MZd8glnhgZo6zZyS@cluster0.stpfwau.mongodb.net/", {
      dbName: process.env?.DB_NAME || "chess",
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB error:", err);
    process.exit(1);
  }
};
