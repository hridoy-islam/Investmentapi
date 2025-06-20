import { Types } from "mongoose";

export interface MonthlyPayment {
  month: string; // Format: "YYYY-MM"
  status: "due" | "paid" | 'partial';
  dueAmount: number;
  paidAmount: number;
}

export interface TInvestmentParticipant {
  investorId: Types.ObjectId; // or string
  investmentId: Types.ObjectId; // or string
  rate: number;
  amount: number;
  status: "active" | "block";
  totalDue: number;
  totalPaid: number;
  monthlyProfits: MonthlyPayment[];
  createdAt?: Date;
  updatedAt?: Date;
}