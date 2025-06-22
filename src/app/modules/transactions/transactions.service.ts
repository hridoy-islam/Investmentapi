import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";

import AppError from "../../errors/AppError";
import { TTransaction } from "./transactions.interface";
import moment from "moment";
import { Transaction } from "./transactions.model";
import { TransactionSearchableFields } from "./transcations.constant";
import { InvestmentParticipant } from "../investmentParticipant/investmentParticipant.model";


export const runMonthlyProfitGeneration = async () => {
  try {
    const participants = await InvestmentParticipant.find({ status: "active" }).populate("investorId", "name").lean();

    const currentDate = moment();
    const currentMonth = currentDate.format("YYYY-MM");

    for (const participant of participants) {
      const {
        _id,
        investorId,
        investmentId,
        amount,
        rate
      } = participant;

      const monthlyProfit = (amount * rate) / 100;

      const existingTransaction = await Transaction.findOne({
        investorId,
        investmentId,
        month: currentMonth,
      });

      if (!existingTransaction) {
        const newTransaction = new Transaction({
          month: currentMonth,
          profit: monthlyProfit,
          status: "due",
          monthlyTotalDue: monthlyProfit,
          monthlyTotalPaid: 0,
          investorId,
          investmentId,
          paymentLog: [
            {
              transactionType: "profitPayment",
              dueAmount: monthlyProfit,
              paidAmount: 0,
              status: "due",
              note: `Payment Initiated To ${(investorId && typeof investorId === 'object' && 'name' in investorId) ? (investorId as any).name : investorId} amount: ${monthlyProfit}`,
            },
          ],
        });

        await newTransaction.save();

        // Update InvestmentParticipant totalDue
        await InvestmentParticipant.findByIdAndUpdate(_id, {
          $inc: { totalDue: monthlyProfit },
        });
      } else {
        // Use a different name to avoid conflict with destructured `totalPaid`
        let transactionPaidSum = 0;

        existingTransaction.paymentLog.forEach((log) => {
          if (log.paidAmount >= log.dueAmount) {
            log.status = "paid";
          } else if (log.paidAmount > 0) {
            log.status = "partial";
          } else {
            log.status = "due";
          }

          transactionPaidSum += log.paidAmount;
        });

        existingTransaction.monthlyTotalPaid = transactionPaidSum;
        existingTransaction.status =
          transactionPaidSum >= existingTransaction.monthlyTotalDue
            ? "paid"
            : transactionPaidSum > 0
            ? "partial"
            : "due";

        await existingTransaction.save();

        // Recalculate and update InvestmentParticipant totalPaid and totalDue
        const totals = await Transaction.aggregate([
          {
            $match: {
              investorId,
              investmentId,
            },
          },
          {
            $group: {
              _id: null,
              totalPaid: { $sum: "$monthlyTotalPaid" },
              totalDue: { $sum: "$monthlyTotalDue" },
            },
          },
        ]);

        const { totalPaid: newTotalPaid = 0, totalDue: newTotalDue = 0 } = totals[0] || {};

        await InvestmentParticipant.findByIdAndUpdate(_id, {
          totalPaid: newTotalPaid,
          totalDue: newTotalDue,
        });
      }
    }

    console.log("✅ Monthly profit generation completed.");
  } catch (error) {
    console.error("❌ Error in monthly profit generation:", error);
  }
};





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

  const existingLogs = transaction.paymentLog || [];

  const lastLog = existingLogs[existingLogs.length - 1];
  const initialDue = lastLog ? lastLog.dueAmount : transaction.profit;

  const newPaidAmount = parseFloat( (payload as any).paidAmount?.toString() || '0');

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

  // Recalculate totals
  const totalPaid = transaction.paymentLog.reduce(
    (sum, log) => sum + log.paidAmount,
    0
  );
  const totalDue = transaction.profit - totalPaid;

  transaction.monthlyTotalPaid = totalPaid;
  transaction.monthlyTotalDue = totalDue;
  transaction.status = totalDue > 0 ? 'partial' : 'paid';

  // ✅ Save updated transaction
  await transaction.save();

  // 🔄 Update related InvestmentParticipant
  const participant = await InvestmentParticipant.findOne({
    investorId: transaction.investorId,
    investmentId: transaction.investmentId
  });

  if (participant) {
    // Recalculate totals from all transactions
    const allTransactions = await Transaction.find({
      investorId: transaction.investorId,
      investmentId: transaction.investmentId
    });

    const totalPaidAcrossTransactions = allTransactions.reduce(
      (sum, tx) => sum + (tx.monthlyTotalPaid || 0),
      0
    );

    const totalDueAcrossTransactions = allTransactions.reduce(
      (sum, tx) => sum + (tx.monthlyTotalDue || 0),
      0
    );

    participant.totalPaid = totalPaidAcrossTransactions;
    participant.totalDue = totalDueAcrossTransactions;

    await participant.save();
  }

  return transaction;
};





export const TransactionServices = {
  getAllTransactionFromDB,
  getSingleTransactionFromDB,
  updateTransactionIntoDB,
  createTransactionIntoDB,
  runMonthlyProfitGeneration
};
