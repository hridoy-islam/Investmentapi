import { Schema, model, Types } from "mongoose";


const investmentParticipantSchema = new Schema(
  {
    investorId: { type: Types.ObjectId, ref: "User", required: true },
    investmentId: { type: Types.ObjectId, ref: "Investment", required: true },
    rate: { type: Number, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["active", "block"], default: "active" },
    totalDue: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
   
  },
  { timestamps: true }
);

export const InvestmentParticipant = model(
  "InvestmentParticipant",
  investmentParticipantSchema
);
