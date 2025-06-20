import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";

import AppError from "../../errors/AppError";
import { TInvestmentParticipant } from "./investmentParticipant.interface";
import moment from "moment";
import { InvestmentParticipant } from "./investmentParticipant.model";
import { InvestmentParticipantSearchableFields } from "./investmentParticipant.constant";


export const runMonthlyProfitGeneration = async () => {
  try {
    const participants = await InvestmentParticipant.find({ status: "active" });

    const currentDate = moment();
    const currentMonth = currentDate.format("YYYY-MM");

    for (const participant of participants) {
      const existingRecord = participant.monthlyProfits.find(
        (record) => record.month === currentMonth
      );

      if (!existingRecord) {
        const monthlyProfit = (participant.amount * participant.rate) / 100;

        const newRecord = {
          month: currentMonth,
          profit: monthlyProfit,
          paymentLog: [
            {
              dueAmount: monthlyProfit,
              paidAmount: 0,
              status: "due"
            }
          ]
        };

        participant.monthlyProfits.push(newRecord);
        participant.totalDue += monthlyProfit;
      }

      // Recalculate totalPaid and update status in each paymentLog entry
      let totalPaid = 0;

      participant.monthlyProfits.forEach((entry) => {
        entry.paymentLog.forEach((log) => {
          // Update status based on payment
          if (log.paidAmount >= log.dueAmount) {
            log.status = "paid";
          } else if (log.paidAmount > 0) {
            log.status = "partial";
          } else {
            log.status = "due";
          }

          totalPaid += log.paidAmount;
        });
      });

      participant.totalPaid = totalPaid;

      await participant.save();
    }

    console.log("Monthly profit update completed.");
  } catch (error) {
    console.error("Error in monthly profit generation:", error);
  }
};



const createInvestmentParticipantIntoDB = async (payload: TInvestmentParticipant) => {
  try {
    const result = await InvestmentParticipant.create(payload);
    return result;
  } catch (error: any) {
    console.error("Error in createInvestmentParticipantParticipantIntoDB:", error);

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

const getAllInvestmentParticipantFromDB = async (query: Record<string, unknown>) => {
  const InvestmentParticipantQuery = new QueryBuilder(
    InvestmentParticipant.find().populate("investorId").populate("investmentId"),
    query
  )
    .search(InvestmentParticipantSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await InvestmentParticipantQuery.countTotal();
  const result = await InvestmentParticipantQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getSingleInvestmentParticipantFromDB = async (id: string) => {
  const result = await InvestmentParticipant.findById(id).populate("investorId").populate("investmentId");
  return result;
};

const updateInvestmentParticipantIntoDB = async (
  id: string,
  payload: Partial<TInvestmentParticipant>
) => {
  const investmentParticipant = await InvestmentParticipant.findById(id);

  if (!investmentParticipant) {
    throw new AppError(httpStatus.NOT_FOUND, "InvestmentParticipant not found");
  }

  let totalPaid = 0;
  let totalDue = 0;

  // Loop through all monthly profits to update payment logs
  investmentParticipant.monthlyProfits = investmentParticipant.monthlyProfits.map(
    (existing) => {
      const updatedProfit = payload.monthlyProfits?.find(
        (p) => p._id?.toString() === existing._id.toString()
      );

      if (updatedProfit) {
        const paymentLogs = existing.paymentLog || [];

        const lastPaymentLog = paymentLogs[paymentLogs.length - 1];
        const initialDue = lastPaymentLog ? lastPaymentLog.dueAmount : existing.profit;

        const newPaidAmount = parseFloat(updatedProfit.paidAmount?.toString() || '0');

        if (newPaidAmount > initialDue) {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            "Paid amount cannot exceed the remaining due"
          );
        }

        const updatedDueAmount = initialDue - newPaidAmount;

        // Add the new payment log entry
        paymentLogs.push({
          dueAmount: updatedDueAmount,
          paidAmount: newPaidAmount,
          status: updatedDueAmount > 0 ? "partial" : "paid",
           note: updatedProfit.note || ""
        });

        // Calculate total paid and due for this profit
        const totalPaidForThis = paymentLogs.reduce(
          (sum, log) => sum + log.paidAmount,
          0
        );
        const totalDueForThis = existing.profit - totalPaidForThis;

        // Accumulate global totals
        totalPaid += totalPaidForThis;
        totalDue += totalDueForThis;

        return {
          ...existing.toObject(),
          paymentLog: paymentLogs,
          status: updatedDueAmount > 0 ? "partial" : "paid"
        };
      } else {
        // For existing profits that weren't updated
        const totalPaidForThis = existing.paymentLog?.reduce(
          (sum, log) => sum + log.paidAmount,
          0
        ) || 0;

        const totalDueForThis = existing.profit - totalPaidForThis;

        totalPaid += totalPaidForThis;
        totalDue += totalDueForThis;

        return existing.toObject();
      }
    }
  );

  // Update main participant fields (amount, rate, status)
  if (payload.amount !== undefined)
    investmentParticipant.amount = payload.amount;
  if (payload.rate !== undefined)
    investmentParticipant.rate = payload.rate;
  if (payload.status !== undefined)
    investmentParticipant.status = payload.status;

  // Update total due and paid fields for the participant
  investmentParticipant.totalPaid = totalPaid;
  investmentParticipant.totalDue = totalDue;

  // Save the updated participant
  const result = await investmentParticipant.save();
  return result;
};





export const InvestmentParticipantServices = {
  getAllInvestmentParticipantFromDB,
  getSingleInvestmentParticipantFromDB,
  updateInvestmentParticipantIntoDB,
  createInvestmentParticipantIntoDB,
  runMonthlyProfitGeneration
};
