import type { ErrorRequestHandler, Response } from "express";
import { InvalidInputError, NotFoundError, UpstreamError } from "./errors";

function send(res: Response, status: number, code: string, message: string) {
  res.status(status).json({ error: { code, message } });
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof InvalidInputError) {
    send(res, 400, "invalid_input", err.message);
  } else if (err instanceof NotFoundError) {
    send(res, 404, "not_found", err.message);
  } else if (err instanceof UpstreamError) {
    console.error(err); 
    send(res, 502, "upstream_error", "The weather service is unavailable. Please try again shortly.");
  } else {
    console.error(err);
    send(res, 500, "internal_error", "Something went wrong on our side. Please try again.");
  }
};