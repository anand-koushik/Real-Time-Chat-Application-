import jwt from "jsonwebtoken";
import { config } from "dotenv";
import { UserModel } from "../models/UserModel.js";

const { verify } = jwt;
config();

export const verifyToken = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      let token = req.cookies?.token;

      if (!token && req.headers.authorization) {
        token = req.headers.authorization.split(" ")[1];
      }

      if (!token) {
        return res.status(401).json({ message: "Please login" });
      }

      const decodedToken = verify(token, process.env.SECRET_KEY);

      const user = await UserModel.findById(decodedToken.id);

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (!user.isUserActive) {
        return res.status(403).json({
          message: "Your account is blocked. Contact admin.",
        });
      }

      if (!allowedRoles.includes(decodedToken.role)) {
        return res.status(403).json({
          message: "You are not authorised",
        });
      }

      req.user = decodedToken;
      next();

    } catch (err) {
      res.status(401).json({ message: "Invalid token" });
    }
  };
};
