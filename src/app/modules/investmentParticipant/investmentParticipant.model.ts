import { Schema, model, Types } from "mongoose";

const PaymentLogSchema = new Schema(
  {
    dueAmount: { type: Number, required: true },
    paidAmount: { type: Number, required: true },
    status: { type: String, enum: ["due", "paid", "partial"], required: true },
    note:{type: String}
  },
  { timestamps: true }
);

const monthlyPaymentSchema = new Schema({
  month: { type: String, required: true }, // format: "YYYY-MM"

  profit: { type: Number, required: true },
  paymentLog: { type: [PaymentLogSchema], default: [] },
});

const investmentParticipantSchema = new Schema(
  {
    investorId: { type: Types.ObjectId, ref: "User", required: true },
    investmentId: { type: Types.ObjectId, ref: "Investment", required: true },
    rate: { type: Number, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["active", "block"], default: "active" },
    totalDue: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    monthlyProfits: { type: [monthlyPaymentSchema], default: [] },
  },
  { timestamps: true }
);

export const InvestmentParticipant = model(
  "InvestmentParticipant",
  investmentParticipantSchema
);
