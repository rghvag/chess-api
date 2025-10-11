import mongoose from "mongoose";

const gameSchema = new mongoose.Schema(
  {
    white: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    black: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fen: { type: String, required: true },
    result: {
      type: String,
      enum: ["white", "black", "draw", "resign", "timeout", null],
      default: null,
    },

    moves: [{ type: String }], // PGN / SAN notation

    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
  },
  { timestamps: true }
);

export const Game = mongoose.model("Game", gameSchema);
