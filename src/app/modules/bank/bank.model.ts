/* eslint-disable @typescript-eslint/no-this-alias */
import { Schema, model } from "mongoose";
import { TBank } from "./bank.interface";

const BankSchema = new Schema<TBank>(
  {
    currency: { type: String }, 
    bankCountry:{type: String},
    BeneficiaryCountry:{type: String},
    beneficiaryBankName:{type: String},
    beneficiaryBankAddress:{type: String},
    beneficiaryBankAcountName:{type: String},
    beneficiaryFirstName:{type: String},
    beneficiaryLastName:{type: String},
    beneficiaryAddress:{type: String},
    beneficiaryCity:{type: String},
    accountNumber: {type:String},
    swift:{type: String},
    addtionalNotes:{type: String},
    userId:{type: Schema.Types.ObjectId, ref:'User'},
    status: {
      type: String,
      enum: ["active", "block"],
      default: "active",
    },
    documents: [{ type: Schema.Types.Mixed }], 
  },
  {
    timestamps: true,
  }
);

export const Bank = model<TBank>("Bank", BankSchema);
