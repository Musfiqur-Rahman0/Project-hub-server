import app from "./app.js";
import config from "./config/index.js";
import { initDB } from "./db/index.js";

const { port } = config;

const main = async () => {
  await initDB();
  app.listen(port, () => {
    console.log(`Server changed is running at http://localhost:${port}`);
  });
};

// Routes and centralized error middleware are configured in app.ts.

main();
