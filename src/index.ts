import express from "express";
import http from "http";
import { connectMongo } from "./config/mongo";
import { connectRedis } from "./config/redis";
import { matchmakingRouter, userRouter } from "./router";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";
import cors from "cors";
import { initWS } from "./ws";
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
app.use("/api/health", (req, res) => {
  const uptime = process.uptime();
  return res.status(200).send({ uptime, message: "Server is healthy" });
});
app.use("/api/v1/user", userRouter);
app.use("/api/v1/matchmaking", matchmakingRouter);

initWS(wss);
server.listen(3000, () =>
  console.log("WS server running on ws://localhost:3000")
);
