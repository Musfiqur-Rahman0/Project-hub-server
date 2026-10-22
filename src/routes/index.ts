import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";

const router = Router();

type TModuleRoute = {
  path: string;
  route: Router;
};

const moduleRoutes: TModuleRoute[] = [{ path: "/auth", route: authRoutes }];

moduleRoutes.forEach((moduleRoute) => {
  router.use(moduleRoute.path, moduleRoute.route);
});

export default router;
