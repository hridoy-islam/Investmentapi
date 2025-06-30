import mongoose, { Schema, model, Types } from "mongoose";

export const AgentPaymentLogSchema = new Schema(
  {
    transactionType: {
      type: String,
      enum: ["commissionPayment", "bonusPayment", "adjustment"],
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

export const AgentTransactionLogSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
    type: {
      type: String,
      enum: [
        "commissionCalculated",
        "commissionPaymentMade",
        "adjustmentMade",
      ],
      required: true,
    },
    message: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
  }
);

const AgentTransactionSchema = new Schema(
  {
    month: { type: String, required: true }, // e.g., "Jun-2025"

    agentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    investmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Investment", required: true },
    investorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    profit: { type: Number, required: true, default: 0 },
    commissionDue: { type: Number, required: true },
    commissionPaid: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["due", "partial", "paid"],
      default: "due",
    },

    paymentLog: {
      type: [AgentPaymentLogSchema],
      default: [],
    },

    logs: {
      type: [AgentTransactionLogSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export const AgentTransaction = model("AgentTransaction", AgentTransactionSchema);
