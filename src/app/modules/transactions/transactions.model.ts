import { Schema, model, Types } from "mongoose";


export const PaymentLogSchema = new Schema(
  {
    transactionType: {
      type: String,
      enum: ["investment", "profitPayment","closeProject"],
      required: true,
    },
    dueAmount: { type: Number, required: true },
    paidAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["due", "partial", "paid"],
      required: true,
    },
    note: { type: String },
  },
  { timestamps: true }
);

export const TransactionLogSchema = new Schema(
  {
    type: {
      type: String,
      enum: [
        "investmentAdded",
        "investmentUpdated",
        "profitDistributed",
        "projectClosed",
        "adminCostDeclared",
        "saleDeclared",
        "commissionCalculated",
        "paymentMade",
      ],
      required: true,
    },
    message: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
  },

);




const MonthlyTransactionSchema = new Schema(
  {
    month: { type: String, required: true }, 

    investorId: { type: Types.ObjectId, ref: "User", required: true },
    investmentId: { type: Types.ObjectId, ref: "Investment", required: true },

    profit: { type: Number, required: true },

    monthlyTotalDue: { type: Number, required: true },
    monthlyTotalPaid: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["due", "partial", "paid"],
      default: "due",
    },

    paymentLog: {
      type: [PaymentLogSchema],
      default: [],
    },

    logs: {
      type: [TransactionLogSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export const Transaction = model("MonthlyTransactions", MonthlyTransactionSchema);
