import { JwtPayload } from "jsonwebtoken";
import { ObjectId } from "mongoose";
import { WebSocket } from "ws";

export interface AuthUser extends JwtPayload {
  userId: string;
}
export interface AuthedWebSocket extends WebSocket {
  userId?: string;
}
