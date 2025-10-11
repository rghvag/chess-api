import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    username: { type: String, unique: true },
    password: { type: String },
    rating: { type: Number, default: 900 },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
