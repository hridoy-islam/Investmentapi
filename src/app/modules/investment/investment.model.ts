/* eslint-disable @typescript-eslint/no-this-alias */
import { Schema, model } from "mongoose";
import { TInvestment } from "./investment.interface";

const investmentSchema = new Schema<TInvestment>(
  {
    title: { type: String, required: true },
    image: { type: String,  },
    details: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "block"],
      default: "active",
    },
    documents: [{ type: Schema.Types.Mixed }], // or Schema.Types.ObjectId if referencing other models
  },
  {
    timestamps: true,
  }
);

export const Investment = model<TInvestment>("Investment", investmentSchema);
