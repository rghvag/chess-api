import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { User } from "../models/User";
import jwt from "jsonwebtoken";

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, username, password } = req.body;
    if (!name || !username || !password) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      res.status(409).json({ error: "Username already taken" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, username, password: hashedPassword });
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const signin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: "Username and password are required" });
      return;
    }
    const user = await User.findOne({ username });
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password as string
    );
    if (!isPasswordValid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "10h",
      }
    );
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
    });
    res.status(200).json({ message: "Login successful" });
  } catch (error) {
    console.error("Error signing in:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserProfile = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ error: "UserId is required" });
    }
    const user = await User.findById(userId).select("-password");
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
