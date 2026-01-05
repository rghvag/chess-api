import express, { Router } from "express";
import { isAuth } from "../middlewares";
import { userController } from "../controller";

const userRouter: Router = express.Router();

userRouter.post("/signup", userController.signup);
userRouter.post("/signin", userController.signin);
userRouter.get("/profile", isAuth, userController.getUserProfile);

export { userRouter };
