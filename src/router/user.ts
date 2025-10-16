import express, { Router } from "express";
import { isAuth } from "../middlewares";
import { getUserProfile, signin, signup } from "../controller";

const userRouter: Router = express.Router();

userRouter.post("/user/signup", signup);
userRouter.post("/user/signin", signin);
userRouter.get("/user/profile", isAuth, getUserProfile);

export { userRouter };
