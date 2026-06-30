import { Router, type IRouter } from "express";
import healthRouter from "./health";
import openaiRouter from "./openai";
import mysticismRouter from "./mysticism";
import configRouter from "./config";
import readingsRouter from "./readings";
import pushRouter from "./push";

const router: IRouter = Router();

router.use(healthRouter);
router.use(openaiRouter);
router.use(mysticismRouter);
router.use(configRouter);
router.use(readingsRouter);
router.use(pushRouter);

export default router;
