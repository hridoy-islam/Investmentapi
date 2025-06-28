import { Router } from "express";
import { UserRoutes } from "../modules/user/user.route";
import { AuthRoutes } from "../modules/auth/auth.router";

import { NotificationsRoutes } from "../modules/notification/notification.route";
import { UploadDocumentRoutes } from "../modules/documents/documents.route";
import { InvestmentRoutes } from "../modules/investment/investment.route";
import { BankRoutes } from "../modules/bank/bank.route";
import { TransactionRoutes } from "../modules/transactions/transactions.route";
import { InvestmentParticipantRoutes } from "../modules/investmentParticipant/investmentParticipant.route";
import { AgentTransactionRoutes } from "../modules/agent-transactions/agent-transactions.route";
import { AgentCommissionRoutes } from "../modules/agent-commission/agent-commission.route";


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
   {
    path: "/transactions",
    route: TransactionRoutes,
  },
   {
    path: "/agent-transactions",
    route: AgentTransactionRoutes,
  },
   {
    path: "/agent-commissions",
    route: AgentCommissionRoutes,
  },
 
 
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
