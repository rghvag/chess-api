import jwt from "jsonwebtoken";
import { IncomingMessage } from "http";
import { AuthedWebSocket } from "../../types";


const JWT_SECRET = process.env.JWT_SECRET!;

export function authenticateWS(
  ws: AuthedWebSocket,
  req: IncomingMessage
) {
  const token = new URL(req.url!, "http://localhost")
    .searchParams
    .get("token");

  if (!token) throw new Error("Token missing");

  const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

  ws.user = { userId: decoded.userId };
}
