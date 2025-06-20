/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/multer";
import { BankControllers } from "./bank.controller";
// import auth from '../../middlewares/auth';

const router = express.Router();
router.get(
  "/",
  // auth("admin", "agent", "investor"),
  BankControllers.getAllBank
);
router.post(
  "/",
  // auth("admin", "agent", "investor"),
  BankControllers.BankCreate
);
router.get(
  "/:id",
  auth("admin", "agent", "investor"),

  BankControllers.getSingleBank
);

router.patch(
  "/:id",
  auth("admin", "agent", "investor"),

  BankControllers.updateBank
);

export const BankRoutes = router;
