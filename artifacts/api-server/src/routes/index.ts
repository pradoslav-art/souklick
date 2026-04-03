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
import adminRouter from "./admin";
import billingRouter from "./billing";
import { requireActiveSubscription } from "../middlewares/auth";

const router: IRouter = Router();

// Unprotected — no subscription check
router.use(adminRouter);
router.use(billingRouter);
router.use(healthRouter);
router.use(authRouter);

// All routes below require an active subscription (or unexpired trial)
router.use(requireActiveSubscription);
router.use(organizationsRouter);
router.use(locationsRouter);
router.use(reviewsRouter);
router.use(responsesRouter);
router.use(aiRouter);
router.use(analyticsRouter);
router.use(notificationsRouter);
router.use(testEmailRouter);

export default router;
