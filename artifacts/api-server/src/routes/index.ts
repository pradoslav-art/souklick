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
import reviewRequestsRouter from "./review-requests";
import responseTemplatesRouter from "./response-templates";
import competitorsRouter from "./competitors";
import autoResponseRulesRouter from "./auto-response-rules";
import widgetRouter from "./widget";
import funnelRouter from "./funnel";
import adminRouter from "./admin";
import billingRouter from "./billing";
import teamRouter from "./team";
import { requireActiveSubscription } from "../middlewares/auth";

const router: IRouter = Router();

// Unprotected — no subscription check
router.use(adminRouter);
router.use(billingRouter);
router.use(healthRouter);
router.use(authRouter);
router.use(teamRouter); // includes public /auth/accept-invite
router.use(widgetRouter); // public widget data endpoint + protected token generator
router.use(funnelRouter); // public feedback funnel for review requests

// All routes below require an active subscription (or unexpired trial)
router.use(requireActiveSubscription);
router.use(organizationsRouter);
router.use(locationsRouter);
router.use(reviewsRouter);
router.use(responsesRouter);
router.use(aiRouter);
router.use(analyticsRouter);
router.use(notificationsRouter);
router.use(reviewRequestsRouter);
router.use(responseTemplatesRouter);
router.use(competitorsRouter);
router.use(autoResponseRulesRouter);

export default router;
