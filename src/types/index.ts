import { JwtPayload } from "jsonwebtoken";
import { WebSocket } from "ws";

export interface AuthUser extends JwtPayload {
  userId: string;
}
export interface AuthedWebSocket extends WebSocket {
  user?: AuthUser;
  isAlive?: boolean;
}

export type WSMessage<T = any> = {
  type: string;
  payload: T;
};

export interface MovePayload {
  from: string;
  to: string;
  game_id: string;
  promotion?: "q" | "r" | "b" | "n";
}

export interface ResignPayload {
  game_id: string;
}
