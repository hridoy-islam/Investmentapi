import { Types } from "mongoose";

// Payment log entry type
export type TAgentPaymentLog = {
  transactionType: "commissionPayment" | "bonusPayment" | "adjustment";
  dueAmount: number;
  paidAmount: number;
  status: "due" | "partial" | "paid";
  note?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

// Transaction log entry type
export type TAgentTransactionLog = {
  _id?: Types.ObjectId;
  type: "commissionCalculated" | "commissionPaymentMade" | "adjustmentMade";
  message: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
};

// Main agent transaction type
export type TAgentTransaction = {
  _id?: Types.ObjectId;
  month: string; // e.g., "Jun-2025"

  agentId: Types.ObjectId;
  investmentId: Types.ObjectId;
  investorId: Types.ObjectId;

  commissionDue: number;
  commissionPaid?: number;
  status?: "due" | "partial" | "paid";

  paymentLog?: TAgentPaymentLog[];
  logs?: TAgentTransactionLog[];

  createdAt?: Date;
  updatedAt?: Date;
};
