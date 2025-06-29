import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";

import AppError from "../../errors/AppError";
import { TTransaction } from "./transactions.interface";
import moment from "moment";
import { Transaction } from "./transactions.model";
import { TransactionSearchableFields } from "./transcations.constant";
import { InvestmentParticipant } from "../investmentParticipant/investmentParticipant.model";







const createTransactionIntoDB = async (payload: TTransaction) => {
  try {
    const result = await Transaction.create(payload);
    return result;
  } catch (error: any) {
    console.error("Error in createTransactionParticipantIntoDB:", error);

    // Throw the original error or wrap it with additional context
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to create Category"
    );
  }
};

const getAllTransactionFromDB = async (query: Record<string, unknown>) => {
  const TransactionQuery = new QueryBuilder(
    Transaction.find().populate("investorId").populate("investmentId"),
    query
  )
    .search(TransactionSearchableFields)
    .filter(query)
    .sort()
    .paginate()
    .fields();

  const meta = await TransactionQuery.countTotal();
  const result = await TransactionQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSingleTransactionFromDB = async (id: string) => {
  const result = await Transaction.findById(id).populate("investorId").populate("investmentId");
  return result;
};

const updateTransactionIntoDB = async (
  id: string,
  payload: Partial<TTransaction>
) => {
  const transaction = await Transaction.findById(id);

  if (!transaction) {
    throw new AppError(httpStatus.NOT_FOUND, 'Transaction not found');
  }

  // Use monthlyTotalDue instead of lastLog.dueAmount
  const initialDue = transaction.monthlyTotalDue;

  const newPaidAmount = parseFloat((payload as any).paidAmount?.toString() || '0');

  if (newPaidAmount > initialDue) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Paid amount cannot exceed the remaining due'
    );
  }

  const updatedDueAmount = initialDue - newPaidAmount;

  transaction.paymentLog.push({
    transactionType: 'profitPayment',
    dueAmount: updatedDueAmount,
    paidAmount: newPaidAmount,
    status: updatedDueAmount > 0 ? 'partial' : 'paid',
    note: (payload as any).note || ''
  });

  // Update monthly totals
  transaction.monthlyTotalPaid = (transaction.monthlyTotalPaid || 0) + newPaidAmount;
  transaction.monthlyTotalDue = updatedDueAmount;
  transaction.status = updatedDueAmount > 0 ? 'partial' : 'paid';

  // ✅ Save updated transaction
  await transaction.save();

  // 🔄 Update related InvestmentParticipant
  const participant = await InvestmentParticipant.findOne({
    investorId: transaction.investorId,
    investmentId: transaction.investmentId
  });

  if (participant) {
    // For totalDue, we want to reduce it by the paid amount, not recalculate from all transactions
    participant.totalPaid = (participant.totalPaid || 0) + newPaidAmount;
    participant.totalDue = (participant.totalDue || 0) - newPaidAmount;

    await participant.save();
  }

  return transaction;
};



export const TransactionServices = {
  getAllTransactionFromDB,
  getSingleTransactionFromDB,
  updateTransactionIntoDB,
  createTransactionIntoDB,

};
