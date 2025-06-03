/* eslint-disable @typescript-eslint/no-this-alias */
import { Schema, model } from "mongoose";
import { TInvestmentParticipant } from "./investmentParticipant.interface";

const InvestmentParticipantSchema = new Schema<TInvestmentParticipant>({
  investorId: { type: String, ref: "User", required: true },
  investmentId: { type: String, required: true, ref: "Investment" },
  rate: { type: Number, required: true },
});

export const InvestmentParticipant = model<TInvestmentParticipant>("InvestmentParticipant", InvestmentParticipantSchema);
