/* eslint-disable @typescript-eslint/no-this-alias */
import { Schema, model } from "mongoose";
import { TInvestment } from "./investment.interface";

const investmentSchema = new Schema(
  {
    title: { type: String, required: true },
    image: { type: String },
    details: { type: String, required: true },

    amountRequired: { type: Number, required: true,default:0 }, // Keep this only ✅

    saleAmount: { type: Number },
    adminCost: { type: Number },

    documents: [{ type: Schema.Types.Mixed }],

    status: {
      type: String,
      enum: ["active","block"],
      default: "active",
    },
  },
  { timestamps: true }
);


export const Investment = model<TInvestment>("Investment", investmentSchema);
