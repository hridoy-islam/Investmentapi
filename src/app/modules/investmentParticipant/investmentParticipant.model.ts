import { Schema, model, Types } from "mongoose";

const investmentParticipantSchema = new Schema(
  {
    investorId: { type: Types.ObjectId, ref: "User", required: true },
    investmentId: { type: Types.ObjectId, ref: "Investment", required: true },

    amount: { type: Number, required: true, default: 0 },

    totalDue: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    agentCommissionRate: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["active", "block"], 
      default: "active",
    },
    amountLastUpdatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const InvestmentParticipant = model(
  "InvestmentParticipant",
  investmentParticipantSchema
);
