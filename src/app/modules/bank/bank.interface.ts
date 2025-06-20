/* eslint-disable no-unused-vars */
import { Types } from "mongoose";

export interface TBank {
  currency?: string;
  bankCountry?: string;
  BeneficiaryCountry?: string;
  beneficiaryBankName?: string;
  beneficiaryBankAddress?: string;
  beneficiaryBankAcountName?: string;
  beneficiaryFirstName?: string;
  beneficiaryLastName?: string;
  beneficiaryAddress?: string;
  beneficiaryCity?: string;
  accountNumber?: string;
  swift?: string;
  addtionalNotes?: string;
  userId?: Types.ObjectId;
  status?: "active" | "block";
  documents?: Array<any>;
}
