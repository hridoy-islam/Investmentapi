/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/multer";
import { AgentTransactionControllers } from "./agent-transactions.controller";
// import auth from '../../middlewares/auth';

const router = express.Router();
router.get(
  "/",
  auth("admin", "agent", "investor"),
  AgentTransactionControllers.getAllAgentTransaction
);
router.post(
  "/",
  auth("admin", "agent", "investor"),
  AgentTransactionControllers.AgentTransactionCreate
);

router.get(
  "/:id",
  auth("admin", "agent", "investor"),

  AgentTransactionControllers.getSingleAgentTransaction
);

router.patch(
  "/:id",
  auth("admin", "agent", "investor"),

  AgentTransactionControllers.updateAgentTransaction
);

export const AgentTransactionRoutes = router;
