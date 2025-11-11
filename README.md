# Real-Time Chess Server

This is a backend WebSocket server for a real-time multiplayer Chess application.  
It manages live matchmaking, player pairing, and in-game state synchronization using WebSockets, MongoDB, and Redis to ensure smooth, low-latency gameplay.

## Tech Stack
- **Node.js + Express** – Core server framework  
- **WebSocket (ws)** – Real-time bidirectional communication  
- **MongoDB** – Persistent storage for user and game data  
- **Redis** – Queue-based matchmaking and scalable performance handling  

## Key Features
- Player matchmaking using Redis queues  
- Real-time gameplay communication over WebSockets  
- MongoDB integration for managing game and user metadata  
- Scalable and modular architecture designed for high concurrency  
