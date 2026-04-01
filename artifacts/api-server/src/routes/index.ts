import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import organizationsRouter from "./organizations";
import locationsRouter from "./locations";
import reviewsRouter from "./reviews";
import responsesRouter from "./responses";
import aiRouter from "./ai";
import analyticsRouter from "./analytics";
import notificationsRouter from "./notifications";
import testEmailRouter from "./test-email";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(organizationsRouter);
router.use(locationsRouter);
router.use(reviewsRouter);
router.use(responsesRouter);
router.use(aiRouter);
router.use(analyticsRouter);
router.use(notificationsRouter);
router.use(testEmailRouter);

export default router;
