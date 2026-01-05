import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true },
    username: { type: String, unique: true },
    password: { type: String },
    rating: { type: Number, default: 900 },
    country: { type: String, default: "India" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
