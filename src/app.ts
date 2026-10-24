import express, { Application, Request, Response } from "express";
import cors from "cors";
import { globalErrorHandler } from "./middleware/globalError.js";
import notFoundHandler from "./middleware/notFound.js";
import router from "./routes/index.js";
import config from "./config/index.js";

const app: Application = express();

app.use(
  cors({
    origin: config.FRONTEND_URL ,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req: Request, res: Response) => {
  res.send("Okey");
});

app.use("/api/v1", router);

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
