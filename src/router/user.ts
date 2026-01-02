import express, { Router } from "express";
import { isAuth } from "../middlewares";
import { getUserProfile, signin, signup } from "../controller";

const userRouter: Router = express.Router();

userRouter.post("/signup", signup);
userRouter.post("/signin", signin);
userRouter.get("/profile", isAuth, getUserProfile);

export { userRouter };
