import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import testRoutes from "../modules/test/test.routes.js";
import submissionRoutes from "../modules/submission/submission.routes.js";

const router = Router();

type TModuleRoute = {
  path: string;
  route: Router;
};

const moduleRoutes: TModuleRoute[] = [
  { path: "/auth", route: authRoutes },
  { path: "/submission", route: submissionRoutes },
  { path: "/test", route: testRoutes },
];

moduleRoutes.forEach((moduleRoute) => {
  router.use(moduleRoute.path, moduleRoute.route);
});

export default router;
