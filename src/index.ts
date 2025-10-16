import express from "express";
import http from "http";
import { connectMongo } from "./config/mongo";
import { connectRedis } from "./config/redis";
import { userRouter } from "./router";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";
import { gameSocket } from "./sockets/gameSocket";
import cors from "cors";
dotenv.config();

const app = express();
const server = http.createServer(app);
const wss: WebSocketServer = new WebSocketServer({ server });

(async () => {
  await connectMongo();
  await connectRedis();
})();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use("/api/v1", userRouter);

gameSocket(wss);
server.listen(3000, () =>
  console.log("WS server running on ws://localhost:3000")
);
