import { WebSocket, WebSocketServer } from "ws";
import jwt from "jsonwebtoken";

export function wsAuthMiddleware(
  ws: WebSocket,
  req: any,
  next: (err?: any) => void
) {
  console.log("inside auth middleqwarre ws");
  try {
    // Extract token from query or header (frontend can send in query: ?token=xxx)
    console.log(req.url, req.headers);
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get("token");

    if (!token) return next(new Error("Unauthorized"));

    const user = jwt.verify(token, process.env.JWT_SECRET as string);
    (ws as any).user = user;
    console.log(user);
    next();
  } catch (err) {
    console.log(err);
    next(err);
  }
}
