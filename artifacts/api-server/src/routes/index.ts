import { Router, type IRouter } from "express";
import healthRouter from "./health";
import openaiRouter from "./openai";
import mysticismRouter from "./mysticism";
import configRouter from "./config";
import readingsRouter from "./readings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(openaiRouter);
router.use(mysticismRouter);
router.use(configRouter);
router.use(readingsRouter);

export default router;
