import { Types } from "mongoose";

export interface TAgentCommission {
  agentId: Types.ObjectId;
  totalCommissionDue: number;
  totalCommissionPaid: number;
  createdAt?: Date;
  updatedAt?: Date;
}