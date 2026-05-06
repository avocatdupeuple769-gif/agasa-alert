import { Router, type IRouter } from "express";
import healthRouter from "./health";
import uploadRouter from "./upload";
import reportsRouter from "./reports";
import alertsRouter from "./alerts";

const router: IRouter = Router();

router.use(healthRouter);
router.use(uploadRouter);
router.use(reportsRouter);
router.use(alertsRouter);

export default router;
