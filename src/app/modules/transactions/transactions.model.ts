import { Schema, model, Types } from "mongoose";

const PaymentLogSchema = new Schema(
  {
    transactionType: {
      type: String,
      enum: ['investment', 'profitPayment'],
      required: true
    },
    dueAmount: {
      type: Number,
      required: true
    },
    paidAmount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['due', 'partial', 'paid'],
      required: true
    },
    note: {
      type: String
    }
  },
  { timestamps: true }
);


const MonthlyTransactionSchema = new Schema(
  {
    month: {
      type: String,
      required: true,
         },
    profit: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['due', 'partial', 'paid'],
      default: 'due'
    },
    monthlyTotalDue: {
      type: Number,
      required: true
    },
    monthlyTotalPaid: {
      type: Number,
      default: 0
    },
    investorId: {
      type: Types.ObjectId,
      ref: 'User',
      required: true
    },
    investmentId: {
      type: Types.ObjectId,
      ref: 'Investment',
      required: true
    },
    paymentLog: {
      type: [PaymentLogSchema],
      default: []
    }
  },
  { timestamps: true }
);



export const Transaction = model('MonthlyTransactions', MonthlyTransactionSchema);  

