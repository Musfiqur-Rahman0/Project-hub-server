import express, { Application, Request, Response } from "express";
import cors from "cors";
import { globalErrorHandler } from "./middleware/globalError.js";
import notFoundHandler from "./middleware/notFound.js";

const app: Application = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req: Request, res: Response) => {
  res.send("Project hub server started");
});

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
