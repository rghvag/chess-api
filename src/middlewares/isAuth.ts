import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload, TokenExpiredError } from "jsonwebtoken";

interface AuthUser extends JwtPayload {
  userId: string;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
  }
}

export const isAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    if (!token) {
      return res.status(401).json({ message: "Token missing or unauthorized" });
    }
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as AuthUser;
    req.user = decoded;
    next();
  } catch (error: any) {
    console.error("JWT error:", error.message);

    if (error instanceof jwt.TokenExpiredError) {
      return res
        .status(401)
        .json({ error: "token expired", message: "Token expired" });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res
        .status(401)
        .json({ error: "invalid token", message: "Invalid token" });
    }

    return res
      .status(500)
      .json({
        error: "internal server error",
        message: "Internal server error",
      });
  }
};
