/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/multer";
import { AgentCommissionControllers } from "./agent-commission.controller";
// import auth from '../../middlewares/auth';

const router = express.Router();
router.get(
  "/",
  // auth("admin", "agent", "investor"),
  AgentCommissionControllers.getAllAgentCommission
);
router.post(
  "/",
  // auth("admin", "agent", "investor"),
  AgentCommissionControllers.AgentCommissionCreate
);
router.get(
  "/:id",
  auth("admin", "agent", "investor"),

  AgentCommissionControllers.getSingleAgentCommission
);

router.patch(
  "/:id",
  auth("admin", "agent", "investor"),

  AgentCommissionControllers.updateAgentCommission
);

export const AgentCommissionRoutes = router;
