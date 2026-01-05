import { AuthedWebSocket } from "../types";

export const userSockets = new Map<string, AuthedWebSocket>();

export const gameSockets = new Map<string, Set<AuthedWebSocket>>();
