import exp from "express";
import { UserModel } from "../models/UserModel.js";
import { hash, compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import { verifyToken } from "../middlewares/VerifyToken.js";
import { config } from "dotenv";
import { upload } from "../config/multer.js";
import { uploadToCloudinary } from "../config/cloudinaryUpload.js";

const { sign } = jwt;

export const commonApp = exp.Router();

config();

// Route for register
commonApp.post("/users", upload.single("profileImageUrl"), async (req, res, next) => {
  try {
    const newUser = req.body;

    newUser.password = await hash(newUser.password, 10);

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      newUser.profileImageUrl = result.secure_url;
    }

    const userDoc = new UserModel(newUser);
    await userDoc.save();

    res.status(201).json({
      message: "User registered successfully",
      payload: userDoc,
    });

  } catch (err) {
    next(err);
  }
});

// Route for Login
commonApp.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user || !(await compare(password, user.password))) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!user.isUserActive) {
      return res.status(403).json({
        message: "Your account is blocked by admin",
      });
    }

    const token = sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.SECRET_KEY,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    res.status(200).json({
      message: "Login successful",
      token: token,
      payload: user,
    });

  } catch (err) {
    res.status(500).json({
      message: "error",
      error: err.message,
    });
  }
});

// Route for Logout
commonApp.get("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });

  res.status(200).json({
    message: "Logout successful",
  });
});

// Page refresh check
commonApp.get("/check-auth", verifyToken("USER", "ADMIN"), (req, res) => {
  res.status(200).json({
    message: "authenticated",
    payload: req.user,
  });
});

// Password change
commonApp.put("/password", verifyToken("USER", "ADMIN"), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await UserModel.findById(req.user.id);

    const isMatch = await compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Incorrect current password",
      });
    }

    user.password = await hash(newPassword, 10);
    await user.save();

    res.status(200).json({
      message: "Password updated successfully",
    });

  } catch (err) {
    res.status(500).json({
      message: "error",
      error: err.message,
    });
  }
});
