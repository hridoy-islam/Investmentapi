/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/multer";
import { TransactionControllers } from "./transactions.controller";
// import auth from '../../middlewares/auth';

const router = express.Router();
router.get(
  "/",
  auth("admin", "agent", "investor"),
  TransactionControllers.getAllTransaction
);
router.post(
  "/",
  auth("admin", "agent", "investor"),
  TransactionControllers.TransactionCreate
);

router.get(
  "/:id",
  auth("admin", "agent", "investor"),

  TransactionControllers.getSingleTransaction
);

router.patch(
  "/:id",
  auth("admin", "agent", "investor"),

  TransactionControllers.updateTransaction
);

export const TransactionRoutes = router;
