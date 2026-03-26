# ♟️ Chess Backend – Distributed Architecture (Redis + WebSockets)

## 📌 Overview

This system is a **real-time multiplayer Chess backend** designed to scale from a single server to a distributed architecture.

### Tech Stack:

* **Node.js + Express** → API layer
* **WebSockets (ws)** → Real-time gameplay
* **MongoDB** → Persistent game state
* **Redis**

  * Queue → Matchmaking
  * Pub/Sub → Cross-server communication

---

## 🧱 High-Level Architecture

### 🔹 Single Server (Current)

```
Client ↔ WebSocket Server ↔ MongoDB
                     ↕
                   Redis (Queue)
```

---

### 🔹 Distributed System (Scaled)

```
                Load Balancer
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
   Server 1                    Server 2
        │                           │
        └──────────┬────────────────┘
                   ▼
               Redis (Pub/Sub)
                   │
               MongoDB
```

---

## ⚙️ Core Responsibilities

### 1. WebSocket Servers

* Handle client connections
* Receive game events (moves, resign, join)
* Broadcast updates to connected clients

---

### 2. Redis Queue (Matchmaking)

* Stores players waiting for a game

#### Flow:

```
LPUSH waitingQueue userId
RPOP waitingQueue → player1
RPOP waitingQueue → player2
```

✅ Benefits:

* Fast (in-memory)
* Atomic operations
* No race conditions

---

### 3. MongoDB (Persistence)

* Stores:

  * Game state
  * Moves
  * Players

✅ Ensures:

* Recovery after crashes
* Source of truth for game state

---

### 4. Redis Pub/Sub (Event Bus)

Used to **synchronize events across multiple servers**

#### Channels:

* `game:updates`
* `game:start`
* `game:end`

---

## 🔄 Distributed Flow

### 🎮 Move Event Flow

```
1. Player makes a move (Client → Server 1)

2. Server 1:
   - Validates move
   - Updates MongoDB
   - Publishes event to Redis

   redisPub.publish("game:updates", moveData)

3. Redis:
   - Broadcasts event to all subscribers

4. Server 2:
   - Receives event via redisSub
   - Finds relevant clients
   - Sends update via WebSocket

5. Player B receives move
```

---

## 🧩 Code-Level Changes

### 1. Redis Setup

```ts
// config/redis.ts
import { createClient } from "redis";

export const redisClient = createClient(); // queue
export const redisPub = createClient();    // publisher
export const redisSub = createClient();    // subscriber

export async function connectRedis() {
  await Promise.all([
    redisClient.connect(),
    redisPub.connect(),
    redisSub.connect(),
  ]);
}
```

---

### 2. Publishing Events

```ts
// inside gameSocket.ts

await redisPub.publish(
  "game:updates",
  JSON.stringify({
    gameId,
    move,
  })
);
```

---

### 3. Subscribing to Events

```ts
// inside gameSocket.ts

redisSub.subscribe("game:updates", (message) => {
  const { gameId, move } = JSON.parse(message);

  // send to relevant clients
  broadcastToGame(gameId, move);
});
```

---

### 4. Client Mapping

Each server maintains:

```
gameId → [connected sockets]
```

Used to:

* Send updates only to relevant players

---

## 🔐 Key Design Decisions

### Why Redis Queue?

* Efficient matchmaking
* Handles concurrency safely

---

### Why Redis Pub/Sub?

* Enables **horizontal scaling**
* Decouples servers
* Real-time event propagation

---

### Why MongoDB?

* Persistent source of truth
* Easy to reconstruct game state

---

## 🚨 Failure Handling

### Redis Failure

#### Impact:

* Pub/Sub stops → no cross-server sync
* Queue data may be lost

#### Mitigation:

* Enable **RDB / AOF persistence**
* Add **auto-reconnect**
* Fallback to in-memory queue (temporary)

---

### WebSocket Server Failure

* Clients reconnect to another server
* Game state fetched from MongoDB

---

### MongoDB Failure

* Critical → game state unavailable

#### Mitigation:

* Use **Replica Set**

---

## 📈 Scalability Strategy

### Phase 1 (Current)

* Single server
* Redis queue only

---

### Phase 2 (Scaled)

* Multiple servers
* Add Redis Pub/Sub

---

### Phase 3 (Advanced)

* Add:

  * BullMQ (job queues)
  * Game timers
  * Microservices

---

## 🧠 Key Takeaways (Interview Ready)

* Redis Queue → matchmaking
* Redis Pub/Sub → event synchronization
* MongoDB → persistence
* WebSockets → real-time gameplay

> The system evolves from a simple architecture to a distributed system by introducing Redis Pub/Sub as a central event bus.

---

## 🚀 Future Improvements

* Add ELO rating system
* Implement game timers
* Add spectator mode
* Use Kubernetes for orchestration
* Introduce microservices

---
