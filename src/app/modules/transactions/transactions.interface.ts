import { Types } from "mongoose";

export interface TPaymentLog {
  transactionType: 'investment' | 'profit-payment';
  dueAmount: number;
  paidAmount: number;
  status: 'due' | 'partial' | 'paid';
  note?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TTransaction {
  _id?: Types.ObjectId;
  month: string; // Format: "YYYY-MM"
  profit: number;
  status: 'due' | 'partial' | 'paid';
  monthlyTotalDue: number;
  monthlyTotalPaid: number;
  investorId: Types.ObjectId;
  investmentId: Types.ObjectId;
  paymentLog: TPaymentLog[];
  createdAt?: Date;
  updatedAt?: Date;
}
