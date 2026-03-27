import { WebSocket } from "ws";
import { pub, sub } from "../config/redis";
import { userSockets } from "../ws/store";

/** Matches docs: cross-server game events (move, start, end). */
export const GAME_REALTIME_CHANNEL = "game:updates";

export type GameDelivery = {
  userId: string;
  payload: unknown;
};

type Envelope = { deliveries: GameDelivery[] };

function parseMessage(raw: string | Buffer): Envelope | null {
  try {
    const text = typeof raw === "string" ? raw : raw.toString("utf8");
    const parsed: unknown = JSON.parse(text);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("deliveries" in parsed) ||
      !Array.isArray((parsed as Envelope).deliveries)
    ) {
      return null;
    }
    return parsed as Envelope;
  } catch {
    return null;
  }
}

/** Send to sockets connected on this process only (used by subscriber and publish fallback). */
export function deliverLocally(deliveries: GameDelivery[]): void {
  for (const { userId, payload } of deliveries) {
    const ws = userSockets.get(userId);
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }
}

export async function publishDeliveries(
  deliveries: GameDelivery[]
): Promise<void> {
  if (deliveries.length === 0) return;
  const body = JSON.stringify({ deliveries } satisfies Envelope);
  try {
    await pub.publish(GAME_REALTIME_CHANNEL, body);
  } catch (err) {
    console.error("Redis publish failed; delivering to local sockets only", err);
    deliverLocally(deliveries);
  }
}

export async function startGameRealtimeSubscriber(): Promise<void> {
  sub.on("error", (err) => {
    console.error("Redis subscriber error", err);
  });

  await sub.subscribe(GAME_REALTIME_CHANNEL, (message, _channel) => {
    const envelope = parseMessage(message);
    if (!envelope) {
      console.warn("Ignoring invalid game realtime pub/sub message");
      return;
    }
    deliverLocally(envelope.deliveries);
  });
}
