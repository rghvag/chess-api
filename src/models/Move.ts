import mongoose from "mongoose";

const moveSchema = new mongoose.Schema({
  game_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Game",
    required: true,
  },
  move_number: { type: Number, required: true },
  notation: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  played_by_color: {
    type: String,
    enum: ["white", "black"],
    required: true,
  },
  fen_after: {
    type: String,
    required: true,
  },
  piece: {
    type: String,
    enum: ["p", "k", "q", "r", "b", "n"],
  },
  from: { type: String, required: true },
  to: { type: String, required: true },
});

export const Move = mongoose.model("Move", moveSchema);
