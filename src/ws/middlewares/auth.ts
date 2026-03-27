import jwt from "jsonwebtoken";
import { IncomingMessage } from "http";
import { AuthedWebSocket } from "../../types";
import { getJwtSecret } from "../../config/env";

export function authenticateWS(
  ws: AuthedWebSocket,
  req: IncomingMessage
) {
  const token = new URL(req.url ?? "/", "http://localhost")
    .searchParams.get("token");

  if (!token) throw new Error("Token missing");

  const decoded = jwt.verify(token, getJwtSecret()) as { userId: string };

  ws.user = { userId: decoded.userId };
}
