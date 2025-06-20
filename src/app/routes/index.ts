import { Router } from "express";
import { UserRoutes } from "../modules/user/user.route";
import { AuthRoutes } from "../modules/auth/auth.router";

import { NotificationsRoutes } from "../modules/notification/notification.route";
import { UploadDocumentRoutes } from "../modules/documents/documents.route";
import { InvestmentRoutes } from "../modules/investment/investment.route";
import { InvestmentParticipantRoutes } from "../modules/investmentParticipant/InvestmentParticipant.route";
import { BankRoutes } from "../modules/bank/bank.route";


const router = Router();

const moduleRoutes = [
  {
    path: "/users",
    route: UserRoutes,
  },
  {
    path: "/auth",
    route: AuthRoutes,
  },

  {
    path: "/notifications",
    route: NotificationsRoutes,
  },
  {
    path: "/documents",
    route: UploadDocumentRoutes,
  },
  {
    path: "/investments",
    route: InvestmentRoutes,
  },
  {
    path: "/investment-participants",
    route: InvestmentParticipantRoutes,
  }, {
    path: "/banks",
    route: BankRoutes,
  },
 
 
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
