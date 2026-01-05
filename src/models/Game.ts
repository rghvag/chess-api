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
    result: {
      type: String,
      enum: ["white", "black", "draw", null],
      default: null,
    },
    result_reason: {
      type: String,
      enum: [
        "checkmate",
        "resignation",
        "timeout",
        "stalemate",
        "agreement",
        "insufficient_material",
        null,
      ],
      default: "timeout",
    },
    time_control: {
      type: String,
    },
    fen: { type: String, required: true, default: "" },
    clock: {
      whiteTimeMs: { type: Number, required: true },
      blackTimeMs: { type: Number, required: true },
      lastMoveAt: { type: Date, required: true },
    },
    // moves:
    started_at: { type: Date, default: Date.now },
    ended_at: { type: Date },
  },
  { timestamps: true }
);

export const Game = mongoose.model("Game", gameSchema);
