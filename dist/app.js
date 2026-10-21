import express from "express";
import cors from "cors";
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/", (_req, res) => {
    res.send("Project hub server started");
});
export default app;
//# sourceMappingURL=app.js.map