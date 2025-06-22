/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/multer";
import { InvestmentParticipantControllers } from "./investmentParticipant.controller";
// import auth from '../../middlewares/auth';

const router = express.Router();
router.get(
  "/",
  auth("admin", "agent", "investor"),
  InvestmentParticipantControllers.getAllInvestmentParticipant
);
router.post(
  "/",
  auth("admin", "agent", "investor"),
  InvestmentParticipantControllers.InvestmentParticipantCreate
);

router.get(
  "/:id",
  auth("admin", "agent", "investor"),

  InvestmentParticipantControllers.getSingleInvestmentParticipant
);

router.patch(
  "/:id",
  auth("admin", "agent", "investor"),

  InvestmentParticipantControllers.updateInvestmentParticipant
);

export const InvestmentParticipantRoutes = router;
