import app from "./app.js";
import config from "./config/index.js";
const { port } = config;
const main = async () => {
    app.listen(port, () => {
        console.log(`Server changed is running at http://localhost:${port}`);
    });
};
main();
//# sourceMappingURL=server.js.map