import express from "express";
import path from "node:path";
import { errorHandler } from "./errorHandler";
import { weatherRouter } from "./routes/weather";

export function createApp() {
  const app = express();

  app.use(express.static(path.join(__dirname, "..", "public")));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/weather", weatherRouter);

  app.use(errorHandler);

  return app;
}