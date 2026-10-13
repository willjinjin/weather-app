import { Router } from "express";
import { InvalidInputError } from "../errors";
import { lookupWeather } from "../weatherService";

export const weatherRouter = Router();

weatherRouter.get("/", async (req, res, next) => {
  try {
    const q = req.query.q;
    if (typeof q !== "string") {
      throw new InvalidInputError("Please enter a location.");
    }
    res.json(await lookupWeather(q));
  } catch (err) {
    next(err);
  }
});