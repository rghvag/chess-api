import express from "express";
import http from "http";
import { connectMongo } from "./config/mongo";
import { connectRedis } from "./config/redis";
import { userRouter } from "./router/";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = http.createServer(app);

(async () => {
  await connectMongo();
  await connectRedis();
})();

app.use(express.json());
app.use(cookieParser());
app.use("/api/v1", userRouter);

server.listen(3000, () =>
  console.log("WS server running on ws://localhost:3000")
);
