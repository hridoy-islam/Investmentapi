/* eslint-disable @typescript-eslint/no-this-alias */
import mongoose, { Schema, model } from "mongoose";
import { TAgentCommission } from "./agent-commission.interface";



const AgentCommissionSummarySchema = new Schema(
  {
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, },
    totalCommissionDue: { type: Number, default: 0 },
    totalCommissionPaid: { type: Number, default: 0 },
    investorId:{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, },
  },
  { timestamps: true }
);

export const AgentCommission = model(
  "AgentCommissionSummary",
  AgentCommissionSummarySchema
);
