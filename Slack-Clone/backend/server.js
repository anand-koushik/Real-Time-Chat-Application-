import exp from "express";
import { config } from "dotenv";
import { connect } from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";
import { createServer } from "http";

import { commonApp } from "./APIs/CommonAPI.js";
import { workspaceApp } from "./APIs/WorkspaceAPI.js";

import { connectRedis } from "./config/redis.js";
import { initializeSocket } from "./sockets/socket.js";

config();

const app = exp();
const httpServer = createServer(app);

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// body parser middleware
app.use(exp.json());

// cookie parser middleware
app.use(cookieParser());

// path level middlewares
app.use("/auth", commonApp);
app.use("/workspace-api", workspaceApp);

// assign port
const port = process.env.PORT || 5000;

// connect to db
const connectDB = async () => {
  try {
    await connect(process.env.DB_URL);
    console.log("DB connected");

    // await connectRedis();

    initializeSocket(httpServer);

    httpServer.listen(port, () => console.log(`server listening on ${port}..`));
  } catch (err) {
    console.log("Error in DB connect", err);
  }
};

connectDB();

// to handle invalid path
app.use((req, res, next) => {
  console.log(req.url);
  res.status(404).json({ message: `path ${req.url} is invalid` });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.log("Error name:", err.name);
  console.log("Error code:", err.code);
  console.log("Error cause:", err.cause);
  console.log("Full error:", err);

  if (err.name === "ValidationError") {
    return res.status(400).json({ message: "error occurred", error: err.message });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ message: "error occurred", error: err.message });
  }

  const errCode = err.code ?? err.cause?.code ?? err.errorResponse?.code;
  const keyValue = err.keyValue ?? err.cause?.keyValue ?? err.errorResponse?.keyValue;

  if (errCode === 11000) {
    const field = Object.keys(keyValue)[0];
    const value = keyValue[field];

    return res.status(409).json({
      message: "error occurred",
      error: `${field} "${value}" already exists`
    });
  }

  res.status(500).json({ message: "error occurred", error: err.message });
});
