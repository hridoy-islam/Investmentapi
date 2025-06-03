/* eslint-disable no-unused-vars */
import { Types } from "mongoose";

export interface TInvestmentParticipant {
  investorId: Types.ObjectId; // Or string, if you prefer to handle IDs as strings primarily
  investmentId: Types.ObjectId; // Or string
  rate: number;
}
