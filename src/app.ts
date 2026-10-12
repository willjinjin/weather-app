import express from "express";
import path from "node:path";

export function createApp() {
  const app = express();

  app.use(express.static(path.join(__dirname, "..", "public")));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  return app;
}