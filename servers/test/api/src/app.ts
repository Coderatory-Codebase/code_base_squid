import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { authRouter } from "./domains/auth/auth.routes.js";
import { notesRouter } from "./domains/notes/notes.routes.js";

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.webOrigin,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

  app.use("/api/auth", authRouter);
  app.use("/api/notes", notesRouter);

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  return app;
}
